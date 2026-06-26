import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

type AccessTokenPayload = {
  userId: string;
  isAdmin: boolean;
};

export function signAccessToken(payload: AccessTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}
