-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('QUESTION', 'HELP_NEEDED', 'MARKETPLACE', 'RESOURCE', 'UPDATE', 'WIN', 'PERSONAL');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'PERSONAL';

-- CreateIndex
CREATE INDEX "Post_type_createdAt_idx" ON "Post"("type", "createdAt");
