import type { NextFunction, Request, Response } from "express";
import type { CreateCommentInput, DeletePostParams } from "../schemas/post.schema";
import { createComment } from "../services/comment.service";
import { AppError } from "../utils/errors";

export async function createCommentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const comment = await createComment({
      postId: (req.params as DeletePostParams).postId,
      authorId: req.user.userId,
      data: req.body as CreateCommentInput
    });

    res.status(201).json({
      status: "success",
      message: "Comment created successfully",
      data: {
        comment
      }
    });
  } catch (error) {
    next(error);
  }
}
