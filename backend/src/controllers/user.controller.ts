import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { getUserProfile } from "../services/user.service";
import type { UserProfileParams } from "../schemas/user.schema";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const profile = await getUserProfile({
      params: req.params as UserProfileParams,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "User profile retrieved successfully",
      data: profile
    });
  } catch (error) {
    next(error);
  }
}
