import { Router } from "express";
import { register } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { registerSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validateRequest({
    body: registerSchema
  }),
  register
);

export default router;
