import type { NextFunction, Request, Response } from "express";
import type { CreateCommentInput, DeleteCommentParams, DeletePostParams, ListPostCommentsQuery } from "../schemas/post.schema";
import { createComment, deleteComment, listPostComments } from "../services/comment.service";
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

export async function deleteCommentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const params = req.params as DeleteCommentParams;

    await deleteComment({
      postId: params.postId,
      commentId: params.commentId,
      viewerUserId: req.user.userId
    });

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function listPostCommentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Authorization is required", 401);
    }

    const result = await listPostComments({
      postId: (req.params as DeletePostParams).postId,
      viewerUserId: req.user.userId,
      query: req.query as unknown as ListPostCommentsQuery
    });

    res.status(200).json({
      status: "success",
      message: "Comments retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}
