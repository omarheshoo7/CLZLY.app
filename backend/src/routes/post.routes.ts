import { Router } from "express";
import { createCommentHandler, deleteCommentHandler, listPostCommentsHandler } from "../controllers/comment.controller";
import { createPostHandler, deletePostHandler, getPostHandler, likePostHandler, savePostHandler, unlikePostHandler, unsavePostHandler, updatePostHandler } from "../controllers/post.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
  createCommentSchema,
  createPostSchema,
  deleteCommentParamsSchema,
  deletePostParamsSchema,
  listPostCommentsQuerySchema
} from "../schemas/post.schema";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateRequest({
    body: createPostSchema
  }),
  createPostHandler
);

router.post(
  "/:postId/like",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  likePostHandler
);

router.post(
  "/:postId/save",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  savePostHandler
);

router.post(
  "/:postId/comments",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema,
    body: createCommentSchema
  }),
  createCommentHandler
);

router.get(
  "/:postId/comments",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema,
    query: listPostCommentsQuerySchema
  }),
  listPostCommentsHandler
);

router.get(
  "/:postId",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  getPostHandler
);

router.patch(
  "/:postId",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema,
    body: createPostSchema
  }),
  updatePostHandler
);

router.delete(
  "/:postId/like",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  unlikePostHandler
);

router.delete(
  "/:postId/save",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  unsavePostHandler
);

router.delete(
  "/:postId/comments/:commentId",
  authMiddleware,
  validateRequest({
    params: deleteCommentParamsSchema
  }),
  deleteCommentHandler
);

router.delete(
  "/:postId",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  deletePostHandler
);

export default router;
