import { Router } from "express";
import { createPostHandler, deletePostHandler } from "../controllers/post.controller";
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

router.delete(
  "/:postId",
  authMiddleware,
  validateRequest({
    params: deletePostParamsSchema
  }),
  deletePostHandler
);

export default router;
