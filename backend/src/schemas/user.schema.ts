import { z } from "zod";

const nullableTrimmedString = (fieldName: string, maxLength: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(maxLength, `${fieldName} must be at most ${maxLength} characters`))
    .transform((value) => (value.length === 0 ? null : value))
    .or(z.null());

const nullableTrimmedUrl = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().max(500, "Profile picture URL must be at most 500 characters"))
  .refine((value) => value.length === 0 || z.string().url().safeParse(value).success, {
    message: "Profile picture URL must be a valid URL"
  })
  .transform((value) => (value.length === 0 ? null : value))
  .or(z.null());

export const userProfileParamsSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
});

export const followUserParamsSchema = userProfileParamsSchema;

export const followRequestParamsSchema = z
  .object({
    followId: z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().min(1, "Follow request id is required"))
  })
  .strict();

export const userSearchQuerySchema = z
  .object({
    q: z
      .string()
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(2, "Search query must be at least 2 characters")
          .max(50, "Search query must be at most 50 characters")
      )
  })
  .strict();

export const socialGraphQuerySchema = z
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

export const updateCurrentUserProfileSchema = z
  .object({
    displayName: nullableTrimmedString("Display name", 50).optional(),
    bio: nullableTrimmedString("Bio", 160).optional(),
    profilePictureUrl: nullableTrimmedUrl.optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field is required"
  });

export const updateCurrentUserPrivacySchema = z
  .object({
    isPrivate: z.boolean()
  })
  .strict();

export type UserProfileParams = z.infer<typeof userProfileParamsSchema>;
export type FollowUserParams = z.infer<typeof followUserParamsSchema>;
export type FollowRequestParams = z.infer<typeof followRequestParamsSchema>;
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
export type SocialGraphQuery = z.infer<typeof socialGraphQuerySchema>;
export type UpdateCurrentUserProfileInput = z.infer<typeof updateCurrentUserProfileSchema>;
export type UpdateCurrentUserPrivacyInput = z.infer<typeof updateCurrentUserPrivacySchema>;
