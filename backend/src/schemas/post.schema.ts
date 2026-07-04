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

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type DeletePostParams = z.infer<typeof deletePostParamsSchema>;
