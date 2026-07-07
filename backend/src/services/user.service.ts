import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type {
  FollowRequestParams,
  FollowUserParams,
  SocialGraphQuery,
  UpdateCurrentUserPrivacyInput,
  UpdateCurrentUserProfileInput,
  UserProfileParams,
  UserSearchQuery
} from "../schemas/user.schema";
import type { ProfilePostsQuery } from "../schemas/post.schema";
import { addPostMetadataToPosts } from "./post.service";
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

type IncomingFollowRequest = {
  id: string;
  status: "PENDING";
  createdAt: Date;
  requester: PublicUserCard;
};

type SearchHistoryUser = Prisma.UserGetPayload<{
  select: typeof searchHistoryUserSelect;
}>;

type ProfileFollowStatus = "SELF" | "FOLLOWING" | "REQUESTED" | "NONE";

type SearchUsersInput = {
  query: UserSearchQuery;
  searcherUserId: string;
};

type FollowUserInput = {
  params: FollowUserParams;
  followerUserId: string;
};

type FollowRequestInput = {
  params: FollowRequestParams;
  receiverUserId: string;
};

type FollowersListInput = {
  params: UserProfileParams;
  query: SocialGraphQuery;
  viewerUserId: string;
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

type GetLikedPostsInput = {
  userId: string;
  query: ProfilePostsQuery;
};

const followRowSelect = {
  id: true,
  followerId: true,
  followingId: true,
  status: true,
  createdAt: true,
  updatedAt: true
} as const;

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

async function getOwnedFollowRequestOrThrow({ followId, receiverUserId }: { followId: string; receiverUserId: string }) {
  const follow = await prisma.follow.findUnique({
    where: {
      id: followId
    },
    select: followRowSelect
  });

  if (!follow || follow.followingId !== receiverUserId) {
    throw new AppError("Follow request not found", 404);
  }

  return follow;
}

async function getActiveUserByUsernameOrThrow(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username
    },
    select: {
      id: true,
      isDisabled: true,
      deletedAt: true
    }
  });

  if (!user || user.deletedAt || user.isDisabled) {
    throw new AppError("User profile not found", 404);
  }

  return user;
}

async function getVisibleSocialGraphUserOrThrow({ username, viewerUserId }: { username: string; viewerUserId: string }) {
  const user = await prisma.user.findUnique({
    where: {
      username
    },
    select: {
      id: true,
      isPrivate: true,
      isDisabled: true,
      deletedAt: true
    }
  });

  if (!user || user.deletedAt || user.isDisabled) {
    throw new AppError("User profile not found", 404);
  }

  if (user.id === viewerUserId || !user.isPrivate) {
    return user;
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerUserId,
        followingId: user.id
      }
    },
    select: {
      status: true
    }
  });

  if (existingFollow?.status !== "ACCEPTED") {
    throw new AppError("You cannot view this user's posts", 403);
  }

  return user;
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

export async function getLikedPosts({ userId, query }: GetLikedPostsInput) {
  let cursorLike: { id: string; userId: string; createdAt: Date } | null = null;

  if (query.cursor) {
    cursorLike = await prisma.postLike.findUnique({
      where: {
        id: query.cursor
      },
      select: {
        id: true,
        userId: true,
        createdAt: true
      }
    });

    if (!cursorLike || cursorLike.userId !== userId) {
      throw new AppError("Invalid cursor", 400);
    }
  }

  const likedPostRows = await prisma.postLike.findMany({
    where: {
      userId,
      post: {
        author: {
          isDisabled: false,
          deletedAt: null,
          OR: [
            {
              id: userId
            },
            {
              isPrivate: false
            },
            {
              followers: {
                some: {
                  followerId: userId,
                  status: "ACCEPTED"
                }
              }
            }
          ]
        }
      },
      ...(cursorLike
        ? {
            OR: [
              {
                createdAt: {
                  lt: cursorLike.createdAt
                }
              },
              {
                createdAt: cursorLike.createdAt,
                id: {
                  lt: cursorLike.id
                }
              }
            ]
          }
        : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: {
      id: true,
      post: {
        select: {
          id: true,
          authorId: true,
          content: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  const hasMore = likedPostRows.length > query.limit;
  const likedPostsPage = hasMore ? likedPostRows.slice(0, query.limit) : likedPostRows;
  const posts = likedPostsPage.map((likedPostRow) => likedPostRow.post);
  const nextCursor = hasMore && likedPostsPage.length > 0
    ? likedPostsPage[likedPostsPage.length - 1].id
    : null;
  const postsWithMetadata = await addPostMetadataToPosts({
    posts,
    viewerUserId: userId
  });

  return {
    posts: postsWithMetadata,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}

export async function getIncomingFollowRequests({ userId }: { userId: string }) {
  const followRequests = await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: "PENDING",
      follower: {
        isDisabled: false,
        deletedAt: null
      }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      status: true,
      createdAt: true,
      follower: {
        select: publicUserCardSelect
      }
    }
  });

  return followRequests.map(
    (followRequest): IncomingFollowRequest => ({
      id: followRequest.id,
      status: "PENDING",
      createdAt: followRequest.createdAt,
      requester: followRequest.follower
    })
  );
}

export async function getFollowers({ params, query, viewerUserId }: FollowersListInput) {
  const profileUser = await getVisibleSocialGraphUserOrThrow({
    username: params.username,
    viewerUserId
  });

  let cursorFollow: { id: string; followingId: string; status: string; createdAt: Date; follower: { isDisabled: boolean; deletedAt: Date | null } } | null = null;

  if (query.cursor) {
    cursorFollow = await prisma.follow.findUnique({
      where: {
        id: query.cursor
      },
      select: {
        id: true,
        followingId: true,
        status: true,
        createdAt: true,
        follower: {
          select: {
            isDisabled: true,
            deletedAt: true
          }
        }
      }
    });

    if (
      !cursorFollow ||
      cursorFollow.followingId !== profileUser.id ||
      cursorFollow.status !== "ACCEPTED" ||
      cursorFollow.follower.isDisabled ||
      cursorFollow.follower.deletedAt
    ) {
      throw new AppError("Invalid cursor", 400);
    }
  }

  const followerRelationships = await prisma.follow.findMany({
    where: {
      followingId: profileUser.id,
      status: "ACCEPTED",
      follower: {
        isDisabled: false,
        deletedAt: null
      },
      ...(cursorFollow
        ? {
            OR: [
              {
                createdAt: {
                  lt: cursorFollow.createdAt
                }
              },
              {
                createdAt: cursorFollow.createdAt,
                id: {
                  lt: cursorFollow.id
                }
              }
            ]
          }
        : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: {
      id: true,
      follower: {
        select: publicUserCardSelect
      }
    }
  });

  const hasMore = followerRelationships.length > query.limit;
  const followerRelationshipsPage = hasMore ? followerRelationships.slice(0, query.limit) : followerRelationships;

  return {
    followers: followerRelationshipsPage.map(({ follower }) => follower),
    pagination: {
      nextCursor: hasMore ? followerRelationshipsPage[followerRelationshipsPage.length - 1]?.id ?? null : null,
      hasMore
    }
  };
}

export async function getFollowing({ params, query, viewerUserId }: FollowersListInput) {
  const profileUser = await getVisibleSocialGraphUserOrThrow({
    username: params.username,
    viewerUserId
  });

  let cursorFollow: { id: string; followerId: string; status: string; createdAt: Date; following: { isDisabled: boolean; deletedAt: Date | null } } | null = null;

  if (query.cursor) {
    cursorFollow = await prisma.follow.findUnique({
      where: {
        id: query.cursor
      },
      select: {
        id: true,
        followerId: true,
        status: true,
        createdAt: true,
        following: {
          select: {
            isDisabled: true,
            deletedAt: true
          }
        }
      }
    });

    if (
      !cursorFollow ||
      cursorFollow.followerId !== profileUser.id ||
      cursorFollow.status !== "ACCEPTED" ||
      cursorFollow.following.isDisabled ||
      cursorFollow.following.deletedAt
    ) {
      throw new AppError("Invalid cursor", 400);
    }
  }

  const followingRelationships = await prisma.follow.findMany({
    where: {
      followerId: profileUser.id,
      status: "ACCEPTED",
      following: {
        isDisabled: false,
        deletedAt: null
      },
      ...(cursorFollow
        ? {
            OR: [
              {
                createdAt: {
                  lt: cursorFollow.createdAt
                }
              },
              {
                createdAt: cursorFollow.createdAt,
                id: {
                  lt: cursorFollow.id
                }
              }
            ]
          }
        : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: {
      id: true,
      following: {
        select: publicUserCardSelect
      }
    }
  });

  const hasMore = followingRelationships.length > query.limit;
  const followingRelationshipsPage = hasMore ? followingRelationships.slice(0, query.limit) : followingRelationships;

  return {
    following: followingRelationshipsPage.map(({ following }) => following),
    pagination: {
      nextCursor: hasMore ? followingRelationshipsPage[followingRelationshipsPage.length - 1]?.id ?? null : null,
      hasMore
    }
  };
}

export async function acceptFollowRequest({ params, receiverUserId }: FollowRequestInput) {
  const follow = await getOwnedFollowRequestOrThrow({
    followId: params.followId,
    receiverUserId
  });

  if (follow.status === "ACCEPTED") {
    throw new AppError("Follow request has already been accepted", 409);
  }

  return prisma.follow.update({
    where: {
      id: follow.id
    },
    data: {
      status: "ACCEPTED"
    },
    select: followRowSelect
  });
}

export async function rejectFollowRequest({ params, receiverUserId }: FollowRequestInput) {
  const follow = await getOwnedFollowRequestOrThrow({
    followId: params.followId,
    receiverUserId
  });

  if (follow.status === "ACCEPTED") {
    throw new AppError("Follow request has already been accepted", 409);
  }

  await prisma.follow.delete({
    where: {
      id: follow.id
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
      select: followRowSelect
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Follow relationship already exists", 409);
    }

    throw error;
  }
}

export async function unfollowUser({ params, followerUserId }: FollowUserInput) {
  const targetUser = await getActiveUserByUsernameOrThrow(params.username);

  if (targetUser.id === followerUserId) {
    throw new AppError("You cannot unfollow yourself", 400);
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

  if (!existingFollow) {
    throw new AppError("Follow relationship not found", 404);
  }

  await prisma.follow.delete({
    where: {
      id: existingFollow.id
    }
  });

  return existingFollow.status === "PENDING"
    ? "Follow request cancelled successfully"
    : "User unfollowed successfully";
}

export async function removeFollower({ params, followingUserId }: { params: UserProfileParams; followingUserId: string }) {
  const followerUser = await getActiveUserByUsernameOrThrow(params.username);

  if (followerUser.id === followingUserId) {
    throw new AppError("You cannot remove yourself as a follower", 400);
  }

  const acceptedFollowerRelationship = await prisma.follow.findFirst({
    where: {
      followerId: followerUser.id,
      followingId: followingUserId,
      status: "ACCEPTED"
    },
    select: {
      id: true
    }
  });

  if (!acceptedFollowerRelationship) {
    throw new AppError("Follower relationship not found", 404);
  }

  await prisma.follow.delete({
    where: {
      id: acceptedFollowerRelationship.id
    }
  });

  return "Follower removed successfully";
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
  let followStatus: ProfileFollowStatus = "SELF";

  if (!isOwnProfile) {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerUserId,
          followingId: user.id
        }
      },
      select: {
        status: true
      }
    });

    followStatus = existingFollow?.status === "ACCEPTED"
      ? "FOLLOWING"
      : existingFollow?.status === "PENDING"
        ? "REQUESTED"
        : "NONE";
  }

  const canViewPosts = isOwnProfile || !user.isPrivate || followStatus === "FOLLOWING";
  const { isDisabled: _isDisabled, deletedAt: _deletedAt, ...safeProfile } = user;

  return {
    user: {
      ...safeProfile,
      followStatus
    },
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
