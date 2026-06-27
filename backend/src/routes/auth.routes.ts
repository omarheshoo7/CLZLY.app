import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validateRequest({
    body: registerSchema
  }),
  register
);

router.post(
  "/login",
  validateRequest({
    body: loginSchema
  }),
  login
);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.get("/me", authMiddleware, me);

export default router;
