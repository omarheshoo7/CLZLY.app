import { prisma } from "../prisma";
import type { UpdateCurrentUserProfileInput, UserProfileParams } from "../schemas/user.schema";
import { AppError } from "../utils/errors";

type GetUserProfileInput = {
  params: UserProfileParams;
  viewerUserId: string;
};

type UpdateCurrentUserProfileServiceInput = {
  userId: string;
  data: UpdateCurrentUserProfileInput;
};

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
