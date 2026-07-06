import { prisma } from "../prisma";
import type { CreateCommentInput, ListPostCommentsQuery } from "../schemas/post.schema";
import { AppError } from "../utils/errors";
import { assertPostVisibleForViewer } from "./post.service";

const commentSelect = {
  id: true,
  postId: true,
  authorId: true,
  content: true,
  createdAt: true,
  updatedAt: true
} as const;

type CreateCommentServiceInput = {
  postId: string;
  authorId: string;
  data: CreateCommentInput;
};

type ListPostCommentsServiceInput = {
  postId: string;
  viewerUserId: string;
  query: ListPostCommentsQuery;
};

export async function createComment({ postId, authorId, data }: CreateCommentServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId: authorId
  });

  return prisma.comment.create({
    data: {
      postId: visiblePost.id,
      authorId,
      content: data.content
    },
    select: commentSelect
  });
}

export async function listPostComments({ postId, viewerUserId, query }: ListPostCommentsServiceInput) {
  const { limit, cursor } = query;

  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const cursorFilter = cursor ? await getCommentCursorFilter({ cursor, postId: visiblePost.id }) : {};

  const comments = await prisma.comment.findMany({
    where: {
      postId: visiblePost.id,
      author: {
        isDisabled: false,
        deletedAt: null
      },
      ...cursorFilter
    },
    orderBy: [
      {
        createdAt: "asc"
      },
      {
        id: "asc"
      }
    ],
    take: limit + 1,
    select: commentSelect
  });

  const hasMore = comments.length > limit;
  const visibleComments = hasMore ? comments.slice(0, limit) : comments;

  return {
    comments: visibleComments,
    pagination: {
      nextCursor: hasMore ? visibleComments[visibleComments.length - 1]?.id ?? null : null,
      hasMore
    }
  };
}

async function getCommentCursorFilter({ cursor, postId }: { cursor: string; postId: string }) {
  const cursorComment = await prisma.comment.findUnique({
    where: {
      id: cursor
    },
    select: {
      id: true,
      postId: true,
      createdAt: true,
      author: {
        select: {
          isDisabled: true,
          deletedAt: true
        }
      }
    }
  });

  if (
    !cursorComment ||
    cursorComment.postId !== postId ||
    cursorComment.author.isDisabled ||
    cursorComment.author.deletedAt
  ) {
    throw new AppError("Invalid cursor", 400);
  }

  return {
    OR: [
      {
        createdAt: {
          gt: cursorComment.createdAt
        }
      },
      {
        createdAt: cursorComment.createdAt,
        id: {
          gt: cursorComment.id
        }
      }
    ]
  };
}
