import { prisma } from "../prisma";
import type { CreateCommentInput } from "../schemas/post.schema";
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
