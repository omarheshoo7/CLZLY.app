import { prisma } from "../prisma";
import type { ProfilePostsQuery } from "../schemas/post.schema";
import { AppError } from "../utils/errors";

const postSelect = {
  id: true,
  authorId: true,
  content: true,
  createdAt: true,
  updatedAt: true
} as const;

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
        }
      }
    });

    const cursorIsVisible =
      cursorPost &&
      visibleAuthorIds.includes(cursorPost.authorId) &&
      !cursorPost.author.isDisabled &&
      cursorPost.author.deletedAt === null;

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

  return {
    posts,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}
