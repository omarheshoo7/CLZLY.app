import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type RequestValidationSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

type ValidationTarget = keyof RequestValidationSchemas;

const validationTargets: ValidationTarget[] = ["body", "params", "query"];

export function validateRequest(schemas: RequestValidationSchemas): RequestHandler {
  return (req, res, next) => {
    const errors: Partial<Record<ValidationTarget, unknown>> = {};
    const parsedValues: Partial<Record<ValidationTarget, unknown>> = {};

    for (const target of validationTargets) {
      const schema = schemas[target];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[target]);

      if (!result.success) {
        errors[target] = result.error.format();
        continue;
      }

      parsedValues[target] = result.data;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors
      });
    }

    if (parsedValues.body !== undefined) {
      req.body = parsedValues.body;
    }

    if (parsedValues.params !== undefined) {
      req.params = parsedValues.params as typeof req.params;
    }

    if (parsedValues.query !== undefined) {
      req.query = parsedValues.query as typeof req.query;
    }

    next();
  };
}
