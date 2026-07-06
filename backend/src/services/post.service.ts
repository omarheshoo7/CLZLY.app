import { prisma } from "../prisma";
import type { UserProfileParams } from "../schemas/user.schema";
import { AppError } from "../utils/errors";
import type { CreatePostInput, ProfilePostsQuery } from "../schemas/post.schema";

const postSelect = {
  id: true,
  authorId: true,
  content: true,
  createdAt: true,
  updatedAt: true
} as const;

type BasePost = {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type PostWithLikeMetadata = BasePost & {
  likesCount: number;
  likedByMe: boolean;
};

type CreatePostServiceInput = {
  authorId: string;
  data: CreatePostInput;
};

type DeletePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type LikePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type UnlikePostServiceInput = {
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
  query: ProfilePostsQuery;
};

type GetPostByIdInput = {
  postId: string;
  viewerUserId: string;
};

export async function assertPostVisibleForViewer({
  postId,
  viewerUserId
}: {
  postId: string;
  viewerUserId: string;
}) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      id: true,
      authorId: true,
      author: {
        select: {
          isPrivate: true,
          isDisabled: true,
          deletedAt: true
        }
      }
    }
  });

  if (!post || post.author.isDisabled || post.author.deletedAt) {
    throw new AppError("Post not found", 404);
  }

  if (viewerUserId === post.authorId || !post.author.isPrivate) {
    return {
      id: post.id,
      authorId: post.authorId
    };
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerUserId,
        followingId: post.authorId
      }
    },
    select: {
      status: true
    }
  });

  if (existingFollow?.status !== "ACCEPTED") {
    throw new AppError("Post not found", 404);
  }

  return {
    id: post.id,
    authorId: post.authorId
  };
}

async function addLikeMetadataToPost({
  post,
  viewerUserId
}: {
  post: BasePost;
  viewerUserId: string;
}): Promise<PostWithLikeMetadata> {
  const [likeCount, viewerLike] = await Promise.all([
    prisma.postLike.count({
      where: {
        postId: post.id
      }
    }),
    prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: viewerUserId,
          postId: post.id
        }
      },
      select: {
        id: true
      }
    })
  ]);

  return {
    ...post,
    likesCount: likeCount,
    likedByMe: Boolean(viewerLike)
  };
}

export async function addLikeMetadataToPosts({
  posts,
  viewerUserId
}: {
  posts: BasePost[];
  viewerUserId: string;
}): Promise<PostWithLikeMetadata[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);

  const [viewerLikes, likeGroups] = await Promise.all([
    prisma.postLike.findMany({
      where: {
        userId: viewerUserId,
        postId: {
          in: postIds
        }
      },
      select: {
        postId: true
      }
    }),
    prisma.postLike.groupBy({
      by: ["postId"],
      where: {
        postId: {
          in: postIds
        }
      },
      _count: {
        postId: true
      }
    })
  ]);

  const likedPostIds = new Set(viewerLikes.map((like) => like.postId));
  const likeCountByPostId = new Map(
    likeGroups.map((group) => [group.postId, group._count.postId])
  );

  return posts.map((post) => ({
    ...post,
    likesCount: likeCountByPostId.get(post.id) ?? 0,
    likedByMe: likedPostIds.has(post.id)
  }));
}

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

export async function getPostById({ postId, viewerUserId }: GetPostByIdInput) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      ...postSelect,
      author: {
        select: {
          id: true,
          isPrivate: true,
          isDisabled: true,
          deletedAt: true
        }
      }
    }
  });

  if (!post || post.author.isDisabled || post.author.deletedAt) {
    throw new AppError("Post not found", 404);
  }

  if (viewerUserId === post.authorId || !post.author.isPrivate) {
    const { author: _author, ...publicPost } = post;
    return addLikeMetadataToPost({
      post: publicPost,
      viewerUserId
    });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerUserId,
        followingId: post.authorId
      }
    },
    select: {
      status: true
    }
  });

  if (existingFollow?.status !== "ACCEPTED") {
    throw new AppError("Post not found", 404);
  }

  const { author: _author, ...publicPost } = post;
  return addLikeMetadataToPost({
    post: publicPost,
    viewerUserId
  });
}

export async function likePost({ postId, viewerUserId }: LikePostServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const existingLike = await prisma.postLike.findUnique({
    where: {
      userId_postId: {
        userId: viewerUserId,
        postId: visiblePost.id
      }
    },
    select: {
      id: true
    }
  });

  if (existingLike) {
    throw new AppError("Post already liked", 409);
  }

  await prisma.postLike.create({
    data: {
      userId: viewerUserId,
      postId: visiblePost.id
    }
  });
}

export async function unlikePost({ postId, viewerUserId }: UnlikePostServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const existingLike = await prisma.postLike.findUnique({
    where: {
      userId_postId: {
        userId: viewerUserId,
        postId: visiblePost.id
      }
    },
    select: {
      id: true
    }
  });

  if (!existingLike) {
    throw new AppError("Post like not found", 404);
  }

  await prisma.postLike.delete({
    where: {
      userId_postId: {
        userId: viewerUserId,
        postId: visiblePost.id
      }
    }
  });
}

export async function getProfilePosts({ params, viewerUserId, query }: GetProfilePostsInput) {
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

  let cursorPost: { id: string; authorId: string; createdAt: Date } | null = null;

  if (query.cursor) {
    cursorPost = await prisma.post.findUnique({
      where: {
        id: query.cursor
      },
      select: {
        id: true,
        authorId: true,
        createdAt: true
      }
    });

    if (!cursorPost || cursorPost.authorId !== profileUser.id) {
      throw new AppError("Invalid cursor", 400);
    }
  }

  const fetchedPosts = await prisma.post.findMany({
    where: {
      authorId: profileUser.id,
      ...(cursorPost
        ? {
            OR: [
              {
                createdAt: {
                  lt: cursorPost.createdAt
                }
              },
              {
                createdAt: cursorPost.createdAt,
                id: {
                  lt: cursorPost.id
                }
              }
            ]
          }
        : {})
    },
    select: postSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1
  });

  const hasMore = fetchedPosts.length > query.limit;
  const posts = hasMore ? fetchedPosts.slice(0, query.limit) : fetchedPosts;
  const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].id : null;
  const postsWithLikeMetadata = await addLikeMetadataToPosts({
    posts,
    viewerUserId
  });

  return {
    posts: postsWithLikeMetadata,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}
