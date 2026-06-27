import { randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "../prisma";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { AppError } from "../utils/errors";
import { hashPassword, hashToken, verifyPassword } from "../utils/hash";
import { signAccessToken } from "../utils/jwt";

type AuthRequestMetadata = {
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

async function createRefreshTokenForUser(userId: string, metadata: AuthRequestMetadata) {
  const rawRefreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress
    }
  });

  return {
    refreshToken: rawRefreshToken,
    refreshTokenExpiresAt
  };
}

function createAccessTokenForUser(user: Pick<User, "id" | "isAdmin">) {
  return signAccessToken({
    userId: user.id,
    isAdmin: user.isAdmin
  });
}

export async function registerUser(input: RegisterInput, metadata: AuthRequestMetadata) {
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

  const { user, refreshToken, refreshTokenExpiresAt } = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash
      }
    });

    const rawRefreshToken = createRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

    await transaction.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress
      }
    });

    return {
      user,
      refreshToken: rawRefreshToken,
      refreshTokenExpiresAt
    };
  });

  const accessToken = createAccessTokenForUser(user);

  return {
    user: removePasswordHash(user),
    accessToken,
    refreshToken,
    refreshTokenExpiresAt
  };
}

export async function loginUser(input: LoginInput, metadata: AuthRequestMetadata) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user || user.deletedAt) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.isDisabled) {
    throw new AppError("Account has been disabled", 403);
  }

  const passwordIsValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordIsValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = createAccessTokenForUser(user);
  const { refreshToken, refreshTokenExpiresAt } = await createRefreshTokenForUser(user.id, metadata);

  return {
    user: removePasswordHash(user),
    accessToken,
    refreshToken,
    refreshTokenExpiresAt
  };
}
