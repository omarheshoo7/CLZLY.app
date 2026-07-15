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
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      profilePictureUrl: true
    }
  }
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

type DeleteCommentServiceInput = {
  postId: string;
  commentId: string;
  viewerUserId: string;
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
  const { limit, cursor, sort } = query;

  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const cursorFilter = cursor
    ? await getCommentCursorFilter({ cursor, postId: visiblePost.id, sort })
    : {};
  const orderBy = sort === "latest"
    ? [
        {
          createdAt: "desc" as const
        },
        {
          id: "desc" as const
        }
      ]
    : [
        {
          createdAt: "asc" as const
        },
        {
          id: "asc" as const
        }
      ];

  const comments = await prisma.comment.findMany({
    where: {
      postId: visiblePost.id,
      author: {
        isDisabled: false,
        deletedAt: null
      },
      ...cursorFilter
    },
    orderBy,
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

export async function deleteComment({ postId, commentId, viewerUserId }: DeleteCommentServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      postId: visiblePost.id
    },
    select: {
      id: true,
      authorId: true
    }
  });

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (comment.authorId !== viewerUserId) {
    throw new AppError("You can only delete your own comment", 403);
  }

  await prisma.comment.delete({
    where: {
      id: comment.id
    }
  });
}

async function getCommentCursorFilter({
  cursor,
  postId,
  sort
}: {
  cursor: string;
  postId: string;
  sort: ListPostCommentsQuery["sort"];
}) {
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

  if (sort === "latest") {
    return {
      OR: [
        {
          createdAt: {
            lt: cursorComment.createdAt
          }
        },
        {
          createdAt: cursorComment.createdAt,
          id: {
            lt: cursorComment.id
          }
        }
      ]
    };
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
