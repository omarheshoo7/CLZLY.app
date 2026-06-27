import jwt, { JsonWebTokenError, type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccessTokenPayload = {
  userId: string;
  isAdmin: boolean;
};

function isAccessTokenPayload(payload: string | JwtPayload): payload is JwtPayload & AccessTokenPayload {
  return typeof payload !== "string" && typeof payload.userId === "string" && typeof payload.isAdmin === "boolean";
}

export function signAccessToken(payload: AccessTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (!isAccessTokenPayload(decoded)) {
    throw new JsonWebTokenError("Invalid access token payload");
  }

  return {
    userId: decoded.userId,
    isAdmin: decoded.isAdmin
  };
}
