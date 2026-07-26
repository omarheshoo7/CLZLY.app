import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

const PROFILE_PICTURE_FIELD_NAME = "profilePicture";
const MAX_PROFILE_PICTURE_SIZE_BYTES = 2 * 1024 * 1024;
const allowedProfilePictureMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);
const allowedProfilePictureExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp"
]);

export const uploadsRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
const profilePicturesUploadRoot = path.join(uploadsRoot, "profile-pictures");

fs.mkdirSync(profilePicturesUploadRoot, { recursive: true });

const profilePictureStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, profilePicturesUploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});

const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: MAX_PROFILE_PICTURE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const hasAllowedMimeType = allowedProfilePictureMimeTypes.has(file.mimetype);
    const hasAllowedExtension = allowedProfilePictureExtensions.has(extension);

    if (!hasAllowedMimeType || !hasAllowedExtension) {
      callback(new AppError("Invalid file type", 400));
      return;
    }

    callback(null, true);
  }
}).single(PROFILE_PICTURE_FIELD_NAME);

export function uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
  profilePictureUpload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new AppError("File exceeds 2MB limit", 413));
        return;
      }

      next(new AppError("Could not upload profile picture", 400));
      return;
    }

    next(error);
  });
}
