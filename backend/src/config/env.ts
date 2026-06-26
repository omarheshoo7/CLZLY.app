import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  PORT: z.coerce.number().int().positive(),
  CLIENT_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1, "ACCESS_TOKEN_EXPIRES_IN is required"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, "REFRESH_TOKEN_EXPIRES_IN is required"),
  REFRESH_COOKIE_NAME: z.string().min(1, "REFRESH_COOKIE_NAME is required"),
  COOKIE_SECURE: z.enum(["true", "false"]).transform((value) => value === "true"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]),
  UPLOAD_DIR: z.string().min(1, "UPLOAD_DIR is required"),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive(),
  MAX_VIDEO_SIZE_MB: z.coerce.number().positive(),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");

  for (const issue of parsedEnv.error.issues) {
    const path = issue.path.join(".");
    console.error(`- ${path}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = parsedEnv.data;
