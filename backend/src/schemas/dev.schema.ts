import { z } from "zod";

export const validationTestBodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(13, "Age must be at least 13")
});
