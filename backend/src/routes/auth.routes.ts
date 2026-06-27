import { Router } from "express";
import { login, refresh, register } from "../controllers/auth.controller";
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

export default router;
