import { Router } from "express";
import {
  acceptMyFollowRequest,
  clearMySearchHistory,
  followUser,
  getMyFollowRequests,
  getProfile,
  getMySearchHistory,
  rejectMyFollowRequest,
  searchUserProfiles,
  updateMyPrivacy,
  updateMyProfile
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
  followRequestParamsSchema,
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

router.get("/me/follow-requests", authMiddleware, getMyFollowRequests);

router.patch(
  "/follow-requests/:followId/accept",
  authMiddleware,
  validateRequest({
    params: followRequestParamsSchema
  }),
  acceptMyFollowRequest
);

router.patch(
  "/follow-requests/:followId/reject",
  authMiddleware,
  validateRequest({
    params: followRequestParamsSchema
  }),
  rejectMyFollowRequest
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

router.get("/me/search-history", authMiddleware, getMySearchHistory);

router.delete("/me/search-history", authMiddleware, clearMySearchHistory);

router.get(
  "/:username",
  authMiddleware,
  validateRequest({
    params: userProfileParamsSchema
  }),
  getProfile
);

export default router;
