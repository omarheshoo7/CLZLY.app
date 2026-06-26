import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: error.format()
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : "Internal server error";

  logger.error(error instanceof Error ? error.stack ?? error.message : String(error));

  res.status(statusCode).json({
    status: "error",
    message,
    ...(env.NODE_ENV === "development" && error instanceof Error ? { stack: error.stack } : {})
  });
};
