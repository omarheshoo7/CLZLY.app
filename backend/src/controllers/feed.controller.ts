import type { NextFunction, Request, Response } from "express";
import type { ProfilePostsQuery } from "../schemas/post.schema";
import { getFeed } from "../services/feed.service";
import { AppError } from "../utils/errors";

export async function getFeedHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const { posts, pagination } = await getFeed({
      viewerUserId: req.user.userId,
      query: req.query as unknown as ProfilePostsQuery
    });

    res.status(200).json({
      status: "success",
      message: "Feed retrieved successfully",
      data: {
        posts,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
}
