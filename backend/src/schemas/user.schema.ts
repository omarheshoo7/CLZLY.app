import { z } from "zod";

export const userProfileParamsSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
});

export type UserProfileParams = z.infer<typeof userProfileParamsSchema>;
