import { z } from "zod";

export const createPostSchema = z
  .object({
    content: z
      .string()
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(1, "Post content is required")
          .max(2000, "Post content must be at most 2000 characters")
      )
  })
  .strict();

export const deletePostParamsSchema = z
  .object({
    postId: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1, "Post id is required"))
  })
  .strict();

export const deleteCommentParamsSchema = z
  .object({
    postId: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1, "Post id is required")),
    commentId: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1, "Comment id is required"))
  })
  .strict();

export const createCommentSchema = z
  .object({
    content: z
      .string()
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(1, "Comment content is required")
          .max(1000, "Comment content must be at most 1000 characters")
      )
  })
  .strict();

export const profilePostsQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit must be at most 50")
      .default(20),
    cursor: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().min(1, "Cursor is required").optional()
    )
  })
  .strict();

export const listPostCommentsQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit must be at most 50")
      .default(20),
    cursor: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().min(1, "Cursor is required").optional()
    )
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type DeletePostParams = z.infer<typeof deletePostParamsSchema>;
export type DeleteCommentParams = z.infer<typeof deleteCommentParamsSchema>;
export type ProfilePostsQuery = z.infer<typeof profilePostsQuerySchema>;
export type ListPostCommentsQuery = z.infer<typeof listPostCommentsQuerySchema>;
