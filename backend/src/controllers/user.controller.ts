import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { getUserProfile, updateCurrentUserPrivacy, updateCurrentUserProfile } from "../services/user.service";
import type {
  UpdateCurrentUserPrivacyInput,
  UpdateCurrentUserProfileInput,
  UserProfileParams
} from "../schemas/user.schema";

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

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const user = await updateCurrentUserProfile({
      userId: req.user.userId,
      data: req.body as UpdateCurrentUserProfileInput
    });

    res.status(200).json({
      status: "success",
      message: "Current user profile updated successfully",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyPrivacy(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const user = await updateCurrentUserPrivacy({
      userId: req.user.userId,
      data: req.body as UpdateCurrentUserPrivacyInput
    });

    res.status(200).json({
      status: "success",
      message: "Account privacy updated successfully",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}
