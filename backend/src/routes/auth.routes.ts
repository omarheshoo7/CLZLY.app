import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
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

export default router;
