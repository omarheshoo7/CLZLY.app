import { randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "../prisma";
import type { RegisterInput } from "../schemas/auth.schema";
import { AppError } from "../utils/errors";
import { hashPassword, hashToken } from "../utils/hash";
import { signAccessToken } from "../utils/jwt";

type RegisterMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type SafeUser = Omit<User, "passwordHash">;

const refreshTokenLifetimeDays = 7;

function createRefreshToken() {
  return randomBytes(64).toString("hex");
}

function getRefreshTokenExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refreshTokenLifetimeDays);
  return expiresAt;
}

function removePasswordHash(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function registerUser(input: RegisterInput, metadata: RegisterMetadata) {
  const existingEmailUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingEmailUser) {
    throw new AppError("Email is already registered", 409);
  }

  const existingUsernameUser = await prisma.user.findUnique({
    where: {
      username: input.username
    }
  });

  if (existingUsernameUser) {
    throw new AppError("Username is already taken", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const rawRefreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash
      }
    });

    await transaction.refreshToken.create({
      data: {
        userId: createdUser.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress
      }
    });

    return createdUser;
  });

  const accessToken = signAccessToken({
    userId: user.id,
    isAdmin: user.isAdmin
  });

  return {
    user: removePasswordHash(user),
    accessToken,
    refreshToken: rawRefreshToken,
    refreshTokenExpiresAt
  };
}
