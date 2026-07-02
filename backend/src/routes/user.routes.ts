import { Router } from "express";
import { getProfile, searchUserProfiles, updateMyPrivacy, updateMyProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
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
