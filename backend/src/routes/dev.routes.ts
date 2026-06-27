import { Router } from "express";
import { protectedTest, validationTest } from "../controllers/dev.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { validationTestBodySchema } from "../schemas/dev.schema";

const router = Router();

router.post(
  "/validation-test",
  validateRequest({
    body: validationTestBodySchema
  }),
  validationTest
);

router.get("/protected-test", authMiddleware, protectedTest);

export default router;
