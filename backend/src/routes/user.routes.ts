import { Router } from "express";
import {
  followUser,
  getProfile,
  searchUserProfiles,
  updateMyPrivacy,
  updateMyProfile
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
  followUserParamsSchema,
  updateCurrentUserPrivacySchema,
  updateCurrentUserProfileSchema,
  userProfileParamsSchema,
  userSearchQuerySchema
} from "../schemas/user.schema";

const router = Router();

router.patch(
  "/me/privacy",
  authMiddleware,
  validateRequest({
    body: updateCurrentUserPrivacySchema
  }),
  updateMyPrivacy
);

router.patch(
  "/me",
  authMiddleware,
  validateRequest({
    body: updateCurrentUserProfileSchema
  }),
  updateMyProfile
);

router.post(
  "/:username/follow",
  authMiddleware,
  validateRequest({
    params: followUserParamsSchema
  }),
  followUser
);

router.get(
  "/search",
  authMiddleware,
  validateRequest({
    query: userSearchQuerySchema
  }),
  searchUserProfiles
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
