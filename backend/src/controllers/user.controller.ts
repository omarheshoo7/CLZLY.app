import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import {
  clearSearchHistory,
  followUser as createFollowRelationship,
  getSearchHistory,
  getUserProfile,
  searchUsers,
  updateCurrentUserPrivacy,
  updateCurrentUserProfile
} from "../services/user.service";
import type {
  FollowUserParams,
  UpdateCurrentUserPrivacyInput,
  UpdateCurrentUserProfileInput,
  UserProfileParams,
  UserSearchQuery
} from "../schemas/user.schema";

export async function searchUserProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const users = await searchUsers({
      query: req.query as UserSearchQuery,
      searcherUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMySearchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const users = await getSearchHistory({
      userId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Search history retrieved successfully",
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function clearMySearchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await clearSearchHistory({
      userId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Search history cleared successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function followUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const follow = await createFollowRelationship({
      params: req.params as FollowUserParams,
      followerUserId: req.user.userId
    });

    res.status(201).json({
      status: "success",
      message: follow.status === "PENDING" ? "Follow request sent successfully" : "User followed successfully",
      data: {
        follow
      }
    });
  } catch (error) {
    next(error);
  }
}

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
