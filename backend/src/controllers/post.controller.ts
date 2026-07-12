import type { NextFunction, Request, Response } from "express";
import type { CreatePostInput, DeletePostParams, ProfilePostsQuery } from "../schemas/post.schema";
import type { UserProfileParams } from "../schemas/user.schema";
import { createPost, deletePost, getPostById, getProfilePosts, hidePost, likePost, savePost, unhidePost, unlikePost, unsavePost, updatePost } from "../services/post.service";
import { AppError } from "../utils/errors";

export async function createPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const post = await createPost({
      authorId: req.user.userId,
      data: req.body as CreatePostInput
    });

    res.status(201).json({
      status: "success",
      message: "Post created successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfilePostsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const { posts, pagination } = await getProfilePosts({
      params: req.params as UserProfileParams,
      viewerUserId: req.user.userId,
      query: req.query as unknown as ProfilePostsQuery
    });

    res.status(200).json({
      status: "success",
      message: "Profile posts retrieved successfully",
      data: {
        posts,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const post = await getPostById({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Post retrieved successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function likePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await likePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(201).json({
      status: "success",
      message: "Post liked successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function savePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await savePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(201).json({
      status: "success",
      message: "Post saved successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function hidePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await hidePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(201).json({
      status: "success",
      message: "Post hidden successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await deletePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Post deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function unlikePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await unlikePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Post unliked successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function unsavePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await unsavePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Post unsaved successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function unhidePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    await unhidePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Post unhidden successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const post = await updatePost({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId,
      data: req.body as CreatePostInput
    });

    res.status(200).json({
      status: "success",
      message: "Post updated successfully",
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
}
