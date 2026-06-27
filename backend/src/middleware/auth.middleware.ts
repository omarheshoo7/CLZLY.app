import type { RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { prisma } from "../prisma";
import { AppError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return next(new AppError("Authorization header is required", 401));
  }

  const [scheme, accessToken, extraValue] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !accessToken || extraValue) {
    return next(new AppError("Authorization header must use Bearer token format", 401));
  }

  try {
    const payload = verifyAccessToken(accessToken);
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      },
      select: {
        id: true,
        isAdmin: true,
        isDisabled: true,
        deletedAt: true
      }
    });

    if (!user || user.deletedAt) {
      throw new AppError("Invalid access token", 401);
    }

    if (user.isDisabled) {
      throw new AppError("Account has been disabled", 403);
    }

    req.user = {
      userId: user.id,
      isAdmin: user.isAdmin
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new AppError("Access token has expired", 401));
    }

    if (error instanceof JsonWebTokenError) {
      return next(new AppError("Invalid access token", 401));
    }

    next(error);
  }
};
