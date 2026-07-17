import { Router } from "express";
import { getFeedHandler } from "../controllers/feed.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { feedQuerySchema } from "../schemas/post.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validateRequest({
    query: feedQuerySchema
  }),
  getFeedHandler
);

export default router;
