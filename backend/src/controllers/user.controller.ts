import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import {
  acceptFollowRequest,
  clearSearchHistory,
  followUser as createFollowRelationship,
  getFollowers,
  getIncomingFollowRequests,
  getFollowing,
  getSearchHistory,
  getUserProfile,
  removeFollower,
  rejectFollowRequest,
  searchUsers,
  unfollowUser as removeFollowRelationship,
  updateCurrentUserPrivacy,
  updateCurrentUserProfile
} from "../services/user.service";
import type {
  FollowRequestParams,
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

export async function getMyFollowRequests(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const requests = await getIncomingFollowRequests({
      userId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Follow requests retrieved successfully",
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowersList(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const users = await getFollowers({
      params: req.params as UserProfileParams
    });

    res.status(200).json({
      status: "success",
      message: "Followers retrieved successfully",
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowingList(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const users = await getFollowing({
      params: req.params as UserProfileParams
    });

    res.status(200).json({
      status: "success",
      message: "Following retrieved successfully",
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptMyFollowRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const follow = await acceptFollowRequest({
      params: req.params as FollowRequestParams,
      receiverUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Follow request accepted successfully",
      data: {
        follow
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectMyFollowRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await rejectFollowRequest({
      params: req.params as FollowRequestParams,
      receiverUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Follow request rejected successfully"
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

export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const message = await removeFollowRelationship({
      params: req.params as UserProfileParams,
      followerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMyFollower(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const message = await removeFollower({
      params: req.params as UserProfileParams,
      followingUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message
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
