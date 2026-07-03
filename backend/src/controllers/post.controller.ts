import type { NextFunction, Request, Response } from "express";
import type { CreatePostInput } from "../schemas/post.schema";
import type { UserProfileParams } from "../schemas/user.schema";
import { createPost, getProfilePosts } from "../services/post.service";
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

    const posts = await getProfilePosts({
      params: req.params as UserProfileParams,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Profile posts retrieved successfully",
      data: {
        posts
      }
    });
  } catch (error) {
    next(error);
  }
}
