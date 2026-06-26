import { Router } from "express";
import { validationTest } from "../controllers/dev.controller";
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

export default router;
