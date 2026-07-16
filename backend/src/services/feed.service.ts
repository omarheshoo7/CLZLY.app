import { prisma } from "../prisma";
import type { ProfilePostsQuery } from "../schemas/post.schema";
import { addPostMetadataToPosts, postSelect } from "./post.service";
import { AppError } from "../utils/errors";

type GetFeedInput = {
  viewerUserId: string;
  query: ProfilePostsQuery;
};

export async function getFeed({ viewerUserId, query }: GetFeedInput) {
  const acceptedFollows = await prisma.follow.findMany({
    where: {
      followerId: viewerUserId,
      status: "ACCEPTED"
    },
    select: {
      followingId: true
    }
  });

  const visibleAuthorIds = [viewerUserId, ...acceptedFollows.map((follow) => follow.followingId)];

  let cursorPost:
    | {
        id: string;
        authorId: string;
        createdAt: Date;
        author: {
          isDisabled: boolean;
          deletedAt: Date | null;
        };
        hiddenBy: { id: string }[];
      }
    | null = null;

  if (query.cursor) {
    cursorPost = await prisma.post.findUnique({
      where: {
        id: query.cursor
      },
      select: {
        id: true,
        authorId: true,
        createdAt: true,
        author: {
          select: {
            isDisabled: true,
            deletedAt: true
          }
        },
        hiddenBy: {
          where: {
            userId: viewerUserId
          },
          select: {
            id: true
          },
          take: 1
        }
      }
    });

    const cursorIsVisible =
      cursorPost &&
      visibleAuthorIds.includes(cursorPost.authorId) &&
      !cursorPost.author.isDisabled &&
      cursorPost.author.deletedAt === null &&
      cursorPost.hiddenBy.length === 0;

    if (!cursorIsVisible) {
      throw new AppError("Invalid cursor", 400);
    }
  }

  const fetchedPosts = await prisma.post.findMany({
    where: {
      authorId: {
        in: visibleAuthorIds
      },
      author: {
        isDisabled: false,
        deletedAt: null
      },
      hiddenBy: {
        none: {
          userId: viewerUserId
        }
      },
      ...(cursorPost
        ? {
            OR: [
              {
                createdAt: {
                  lt: cursorPost.createdAt
                }
              },
              {
                createdAt: cursorPost.createdAt,
                id: {
                  lt: cursorPost.id
                }
              }
            ]
          }
        : {})
    },
    select: postSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1
  });

  const hasMore = fetchedPosts.length > query.limit;
  const posts = hasMore ? fetchedPosts.slice(0, query.limit) : fetchedPosts;
  const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].id : null;
  const postsWithMetadata = await addPostMetadataToPosts({
    posts,
    viewerUserId
  });

  return {
    posts: postsWithMetadata,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}
