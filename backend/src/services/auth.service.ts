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
  const refreshToken = createRefreshTokenData(userId, metadata);

  await prisma.refreshToken.create({
    data: refreshToken.data
  });

  return {
    refreshToken: refreshToken.rawRefreshToken,
    refreshTokenExpiresAt: refreshToken.refreshTokenExpiresAt
  };
}

function createRefreshTokenData(userId: string, metadata: AuthRequestMetadata) {
  const rawRefreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  return {
    rawRefreshToken,
    refreshTokenExpiresAt,
    data: {
      userId,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress
    }
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

export async function refreshAccessToken(rawRefreshToken: string | undefined, metadata: AuthRequestMetadata) {
  if (!rawRefreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  const refreshTokenHash = hashToken(rawRefreshToken);

  const existingRefreshToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: refreshTokenHash
    },
    include: {
      user: true
    }
  });

  if (!existingRefreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (existingRefreshToken.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: {
        userId: existingRefreshToken.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    throw new AppError("Refresh token was reused. Please log in again.", 401);
  }

  if (existingRefreshToken.expiresAt < new Date()) {
    throw new AppError("Refresh token has expired", 401);
  }

  const user = existingRefreshToken.user;

  if (!user || user.deletedAt) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (user.isDisabled) {
    throw new AppError("Account has been disabled", 403);
  }

  const newRefreshToken = createRefreshTokenData(user.id, metadata);

  await prisma.$transaction(async (transaction) => {
    const createdRefreshToken = await transaction.refreshToken.create({
      data: newRefreshToken.data
    });

    await transaction.refreshToken.update({
      where: {
        id: existingRefreshToken.id
      },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: createdRefreshToken.id
      }
    });
  });

  const accessToken = createAccessTokenForUser(user);

  return {
    accessToken,
    refreshToken: newRefreshToken.rawRefreshToken,
    refreshTokenExpiresAt: newRefreshToken.refreshTokenExpiresAt
  };
}

export async function logoutUser(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) {
    return;
  }

  const refreshTokenHash = hashToken(rawRefreshToken);
  const existingRefreshToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: refreshTokenHash
    }
  });

  if (!existingRefreshToken || existingRefreshToken.revokedAt) {
    return;
  }

  await prisma.refreshToken.update({
    where: {
      id: existingRefreshToken.id
    },
    data: {
      revokedAt: new Date()
    }
  });
}
