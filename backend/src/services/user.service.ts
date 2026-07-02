import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type {
  FollowUserParams,
  UpdateCurrentUserPrivacyInput,
  UpdateCurrentUserProfileInput,
  UserProfileParams,
  UserSearchQuery
} from "../schemas/user.schema";
import { AppError } from "../utils/errors";

type SearchUsersInput = {
  query: UserSearchQuery;
};

type FollowUserInput = {
  params: FollowUserParams;
  followerUserId: string;
};

type GetUserProfileInput = {
  params: UserProfileParams;
  viewerUserId: string;
};

type UpdateCurrentUserProfileServiceInput = {
  userId: string;
  data: UpdateCurrentUserProfileInput;
};

type UpdateCurrentUserPrivacyServiceInput = {
  userId: string;
  data: UpdateCurrentUserPrivacyInput;
};

export async function searchUsers({ query }: SearchUsersInput) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      isDisabled: false,
      OR: [
        {
          username: {
            contains: query.q,
            mode: "insensitive"
          }
        },
        {
          displayName: {
            contains: query.q,
            mode: "insensitive"
          }
        }
      ]
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      profilePictureUrl: true,
      isPrivate: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 10
  });
}

export async function followUser({ params, followerUserId }: FollowUserInput) {
  const targetUser = await prisma.user.findUnique({
    where: {
      username: params.username
    },
    select: {
      id: true,
      isPrivate: true,
      isDisabled: true,
      deletedAt: true
    }
  });

  if (!targetUser || targetUser.deletedAt || targetUser.isDisabled) {
    throw new AppError("User profile not found", 404);
  }

  if (targetUser.id === followerUserId) {
    throw new AppError("You cannot follow yourself", 400);
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: followerUserId,
        followingId: targetUser.id
      }
    },
    select: {
      id: true,
      status: true
    }
  });

  if (existingFollow) {
    if (existingFollow.status === "PENDING") {
      throw new AppError("Follow request is already pending", 409);
    }

    throw new AppError("You are already following this user", 409);
  }

  try {
    return await prisma.follow.create({
      data: {
        followerId: followerUserId,
        followingId: targetUser.id,
        status: targetUser.isPrivate ? "PENDING" : "ACCEPTED"
      },
      select: {
        id: true,
        followerId: true,
        followingId: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Follow relationship already exists", 409);
    }

    throw error;
  }
}

export async function getUserProfile({ params, viewerUserId }: GetUserProfileInput) {
  const user = await prisma.user.findUnique({
    where: {
      username: params.username
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      profilePictureUrl: true,
      isPrivate: true,
      isDisabled: true,
      deletedAt: true,
      createdAt: true
    }
  });

  if (!user || user.deletedAt || user.isDisabled) {
    throw new AppError("User profile not found", 404);
  }

  const isOwnProfile = user.id === viewerUserId;
  const canViewPosts = isOwnProfile || !user.isPrivate;
  const { isDisabled: _isDisabled, deletedAt: _deletedAt, ...safeProfile } = user;

  return {
    user: safeProfile,
    canViewPosts
  };
}

export async function updateCurrentUserProfile({ userId, data }: UpdateCurrentUserProfileServiceInput) {
  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
      profilePictureUrl: true,
      isPrivate: true,
      isAdmin: true,
      isDisabled: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (user.deletedAt) {
    throw new AppError("Invalid access token", 401);
  }

  if (user.isDisabled) {
    throw new AppError("Account has been disabled", 403);
  }

  return user;
}

export async function updateCurrentUserPrivacy({ userId, data }: UpdateCurrentUserPrivacyServiceInput) {
  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      isPrivate: data.isPrivate
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
      profilePictureUrl: true,
      isPrivate: true,
      isAdmin: true,
      isDisabled: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (user.deletedAt) {
    throw new AppError("Invalid access token", 401);
  }

  if (user.isDisabled) {
    throw new AppError("Account has been disabled", 403);
  }

  return user;
}
