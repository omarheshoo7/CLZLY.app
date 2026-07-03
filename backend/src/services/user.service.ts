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

const publicUserCardSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  profilePictureUrl: true,
  isPrivate: true,
  createdAt: true
} as const;

const searchHistoryUserSelect = {
  ...publicUserCardSelect,
  isDisabled: true,
  deletedAt: true
} as const;

type PublicUserCard = Prisma.UserGetPayload<{
  select: typeof publicUserCardSelect;
}>;

type SearchHistoryUser = Prisma.UserGetPayload<{
  select: typeof searchHistoryUserSelect;
}>;

type SearchUsersInput = {
  query: UserSearchQuery;
  searcherUserId: string;
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

type RecordSearchHistoryInput = {
  searcherUserId: string;
  users: PublicUserCard[];
};

type GetSearchHistoryInput = {
  userId: string;
};

type ClearSearchHistoryInput = {
  userId: string;
};

function dedupeSearchHistoryUsers(users: PublicUserCard[], searcherUserId: string) {
  const seenUserIds = new Set<string>();
  const uniqueUsers: PublicUserCard[] = [];

  for (const user of users) {
    if (user.id === searcherUserId || seenUserIds.has(user.id)) {
      continue;
    }

    seenUserIds.add(user.id);
    uniqueUsers.push(user);
  }

  return uniqueUsers;
}

async function recordSearchHistory({ searcherUserId, users }: RecordSearchHistoryInput) {
  const uniqueUsers = dedupeSearchHistoryUsers(users, searcherUserId);

  if (uniqueUsers.length === 0) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    for (const user of uniqueUsers) {
      await transaction.userSearchHistory.upsert({
        where: {
          searcherId_searchedUserId: {
            searcherId: searcherUserId,
            searchedUserId: user.id
          }
        },
        create: {
          searcherId: searcherUserId,
          searchedUserId: user.id
        },
        update: {
          updatedAt: new Date()
        }
      });
    }
  });
}

function toPublicUserCard(user: SearchHistoryUser): PublicUserCard {
  const { isDisabled: _isDisabled, deletedAt: _deletedAt, ...safeUser } = user;

  return safeUser;
}

export async function searchUsers({ query, searcherUserId }: SearchUsersInput) {
  const users = await prisma.user.findMany({
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
    select: publicUserCardSelect,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 10
  });

  await recordSearchHistory({
    searcherUserId,
    users
  });

  return users;
}

export async function getSearchHistory({ userId }: GetSearchHistoryInput) {
  const historyEntries = await prisma.userSearchHistory.findMany({
    where: {
      searcherId: userId
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      searchedUser: {
        select: searchHistoryUserSelect
      }
    }
  });

  return historyEntries
    .map(({ searchedUser }) => searchedUser)
    .filter((searchedUser) => !searchedUser.isDisabled && searchedUser.deletedAt === null)
    .map((searchedUser) => toPublicUserCard(searchedUser));
}

export async function clearSearchHistory({ userId }: ClearSearchHistoryInput) {
  await prisma.userSearchHistory.deleteMany({
    where: {
      searcherId: userId
    }
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
