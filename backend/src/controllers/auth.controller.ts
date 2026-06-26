import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { registerUser } from "../services/auth.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.cookie(env.REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: "/api/auth",
      expires: result.refreshTokenExpiresAt
    });

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
