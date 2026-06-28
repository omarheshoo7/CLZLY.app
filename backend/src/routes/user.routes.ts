import { Router } from "express";
import { getProfile, updateMyProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { updateCurrentUserProfileSchema, userProfileParamsSchema } from "../schemas/user.schema";

const router = Router();

router.patch(
  "/me",
  authMiddleware,
  validateRequest({
    body: updateCurrentUserProfileSchema
  }),
  updateMyProfile
);

router.get(
  "/:username",
  authMiddleware,
  validateRequest({
    params: userProfileParamsSchema
  }),
  getProfile
);

export default router;
