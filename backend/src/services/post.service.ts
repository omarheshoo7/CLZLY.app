import { prisma } from "../prisma";
import type { UserProfileParams } from "../schemas/user.schema";
import { AppError } from "../utils/errors";
import type { CreatePostInput } from "../schemas/post.schema";

const postSelect = {
  id: true,
  authorId: true,
  content: true,
  createdAt: true,
  updatedAt: true
} as const;

type CreatePostServiceInput = {
  authorId: string;
  data: CreatePostInput;
};

type DeletePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type UpdatePostServiceInput = {
  postId: string;
  viewerUserId: string;
  data: CreatePostInput;
};

type GetProfilePostsInput = {
  params: UserProfileParams;
  viewerUserId: string;
};

export async function createPost({ authorId, data }: CreatePostServiceInput) {
  return prisma.post.create({
    data: {
      authorId,
      content: data.content
    },
    select: postSelect
  });
}

export async function deletePost({ postId, viewerUserId }: DeletePostServiceInput) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      id: true,
      authorId: true
    }
  });

  if (!post || post.authorId !== viewerUserId) {
    throw new AppError("Post not found", 404);
  }

  await prisma.post.delete({
    where: {
      id: post.id
    }
  });
}

export async function updatePost({ postId, viewerUserId, data }: UpdatePostServiceInput) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      id: true,
      authorId: true
    }
  });

  if (!post || post.authorId !== viewerUserId) {
    throw new AppError("Post not found", 404);
  }

  return prisma.post.update({
    where: {
      id: post.id
    },
    data: {
      content: data.content
    },
    select: postSelect
  });
}

export async function getProfilePosts({ params, viewerUserId }: GetProfilePostsInput) {
  const profileUser = await prisma.user.findUnique({
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

  if (!profileUser || profileUser.deletedAt || profileUser.isDisabled) {
    throw new AppError("User profile not found", 404);
  }

  const isOwnProfile = profileUser.id === viewerUserId;
  const isPublicProfile = !profileUser.isPrivate;

  if (!isOwnProfile && !isPublicProfile) {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerUserId,
          followingId: profileUser.id
        }
      },
      select: {
        status: true
      }
    });

    if (existingFollow?.status !== "ACCEPTED") {
      throw new AppError("You cannot view this user's posts", 403);
    }
  }

  return prisma.post.findMany({
    where: {
      authorId: profileUser.id
    },
    select: postSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
