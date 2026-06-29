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
export type UpdateCurrentUserProfileInput = z.infer<typeof updateCurrentUserProfileSchema>;
export type UpdateCurrentUserPrivacyInput = z.infer<typeof updateCurrentUserPrivacySchema>;
