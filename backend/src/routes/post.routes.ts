import { Router } from "express";
import { createPostHandler, deletePostHandler, getPostHandler, likePostHandler, unlikePostHandler, updatePostHandler } from "../controllers/post.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createPostSchema, deletePostParamsSchema } from "../schemas/post.schema";

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
  "/:postId",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  deletePostHandler
);

export default router;
