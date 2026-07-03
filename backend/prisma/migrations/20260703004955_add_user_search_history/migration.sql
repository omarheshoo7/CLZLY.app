-- CreateTable
CREATE TABLE "user_search_history" (
    "id" TEXT NOT NULL,
    "searcherId" TEXT NOT NULL,
    "searchedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_search_history_searcherId_updatedAt_idx" ON "user_search_history"("searcherId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_search_history_searcherId_searchedUserId_key" ON "user_search_history"("searcherId", "searchedUserId");

-- AddForeignKey
ALTER TABLE "user_search_history" ADD CONSTRAINT "user_search_history_searcherId_fkey" FOREIGN KEY ("searcherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_search_history" ADD CONSTRAINT "user_search_history_searchedUserId_fkey" FOREIGN KEY ("searchedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
