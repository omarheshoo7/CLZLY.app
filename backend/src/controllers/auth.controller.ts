import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { loginUser, registerUser } from "../services/auth.service";

function setRefreshTokenCookie(res: Response, refreshToken: string, expiresAt: Date) {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/api/auth",
    expires: expiresAt
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}
