import { Router } from "express";
import { createPostHandler } from "../controllers/post.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createPostSchema } from "../schemas/post.schema";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateRequest({
    body: createPostSchema
  }),
  createPostHandler
);

export default router;
