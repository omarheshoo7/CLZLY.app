import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../services/auth.service";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/api/auth"
} as const;

function setRefreshTokenCookie(res: Response, refreshToken: string, expiresAt: Date) {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    ...refreshCookieOptions,
    expires: expiresAt
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions);
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

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
    const result = await refreshAccessToken(rawRefreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

    res.status(200).json({
      status: "success",
      message: "Access token refreshed successfully",
      data: {
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];

    await logoutUser(rawRefreshToken);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
}
