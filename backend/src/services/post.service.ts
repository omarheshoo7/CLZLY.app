import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { UserProfileParams } from "../schemas/user.schema";
import { AppError } from "../utils/errors";
import type { CreatePostInput, ProfilePostsQuery } from "../schemas/post.schema";

export const postAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  profilePictureUrl: true
} as const;

export const postSelect = {
  id: true,
  authorId: true,
  author: {
    select: postAuthorSelect
  },
  content: true,
  createdAt: true,
  updatedAt: true
} as const;

type BasePost = Prisma.PostGetPayload<{
  select: typeof postSelect;
}>;

type PostWithMetadata = BasePost & {
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
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

type SavePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type HidePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type UnlikePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type UnsavePostServiceInput = {
  postId: string;
  viewerUserId: string;
};

type UnhidePostServiceInput = {
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

async function addPostMetadataToPost({
  post,
  viewerUserId
}: {
  post: BasePost;
  viewerUserId: string;
}): Promise<PostWithMetadata> {
  const [postWithMetadata] = await addPostMetadataToPosts({
    posts: [post],
    viewerUserId
  });

  return postWithMetadata;
}

export async function addPostMetadataToPosts({
  posts,
  viewerUserId
}: {
  posts: BasePost[];
  viewerUserId: string;
}): Promise<PostWithMetadata[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);

  const [viewerLikes, likeGroups, commentGroups] = await Promise.all([
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
    }),
    prisma.comment.groupBy({
      by: ["postId"],
      where: {
        postId: {
          in: postIds
        },
        author: {
          isDisabled: false,
          deletedAt: null
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
  const commentCountByPostId = new Map(
    commentGroups.map((group) => [group.postId, group._count.postId])
  );

  return posts.map((post) => ({
    ...post,
    likesCount: likeCountByPostId.get(post.id) ?? 0,
    likedByMe: likedPostIds.has(post.id),
    commentsCount: commentCountByPostId.get(post.id) ?? 0
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
      id: true,
      authorId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          ...postAuthorSelect,
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

  const {
    isPrivate: authorIsPrivate,
    isDisabled: _authorIsDisabled,
    deletedAt: _authorDeletedAt,
    ...safeAuthor
  } = post.author;
  const { author: _author, ...postFields } = post;
  const publicPost = {
    ...postFields,
    author: safeAuthor
  };

  if (viewerUserId === post.authorId || !authorIsPrivate) {
    return addPostMetadataToPost({
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

  return addPostMetadataToPost({
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

export async function savePost({ postId, viewerUserId }: SavePostServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const existingSavedPost = await prisma.savedPost.findUnique({
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

  if (existingSavedPost) {
    throw new AppError("Post already saved", 409);
  }

  await prisma.savedPost.create({
    data: {
      userId: viewerUserId,
      postId: visiblePost.id
    }
  });
}

export async function hidePost({ postId, viewerUserId }: HidePostServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  if (visiblePost.authorId === viewerUserId) {
    throw new AppError("You cannot hide your own post", 400);
  }

  const existingHiddenPost = await prisma.hiddenPost.findUnique({
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

  if (existingHiddenPost) {
    throw new AppError("Post already hidden", 409);
  }

  await prisma.hiddenPost.create({
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

export async function unsavePost({ postId, viewerUserId }: UnsavePostServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const existingSavedPost = await prisma.savedPost.findUnique({
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

  if (!existingSavedPost) {
    throw new AppError("Saved post not found", 404);
  }

  await prisma.savedPost.delete({
    where: {
      userId_postId: {
        userId: viewerUserId,
        postId: visiblePost.id
      }
    }
  });
}

export async function unhidePost({ postId, viewerUserId }: UnhidePostServiceInput) {
  const visiblePost = await assertPostVisibleForViewer({
    postId,
    viewerUserId
  });

  const existingHiddenPost = await prisma.hiddenPost.findUnique({
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

  if (!existingHiddenPost) {
    throw new AppError("Hidden post not found", 404);
  }

  await prisma.hiddenPost.delete({
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
  const postsWithMetadata = await addPostMetadataToPosts({
    posts,
    viewerUserId
  });

  return {
    posts: postsWithMetadata,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}
