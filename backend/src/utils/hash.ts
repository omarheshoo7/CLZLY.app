import bcrypt from "bcrypt";
import { createHash } from "crypto";

const passwordSaltRounds = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, passwordSaltRounds);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
