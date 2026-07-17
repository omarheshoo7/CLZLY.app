import { z } from "zod";

const postTypeValues = [
  "QUESTION",
  "HELP_NEEDED",
  "MARKETPLACE",
  "RESOURCE",
  "UPDATE",
  "WIN",
  "PERSONAL"
] as const;

export const postTypeSchema = z.enum(postTypeValues);

const paginationQuerySchema = {
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
};

const feedTypesQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    const rawValues = Array.isArray(value) ? value : [value];

    return rawValues.flatMap((rawValue) => {
      if (typeof rawValue !== "string") {
        return rawValue;
      }

      return rawValue.split(",").map((type) => type.trim());
    });
  },
  z.array(postTypeSchema).min(1, "At least one post type is required").optional()
).transform((types) => (types ? Array.from(new Set(types)) : undefined));

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
      ),
    type: postTypeSchema.default("PERSONAL")
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
    ...paginationQuerySchema
  })
  .strict();

export const feedQuerySchema = z
  .object({
    ...paginationQuerySchema,
    types: feedTypesQuerySchema
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
    ),
    sort: z.enum(["oldest", "latest"]).default("oldest")
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type DeletePostParams = z.infer<typeof deletePostParamsSchema>;
export type DeleteCommentParams = z.infer<typeof deleteCommentParamsSchema>;
export type ProfilePostsQuery = z.infer<typeof profilePostsQuerySchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type ListPostCommentsQuery = z.infer<typeof listPostCommentsQuerySchema>;
