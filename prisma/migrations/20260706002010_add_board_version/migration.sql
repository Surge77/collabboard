-- Append-only per-board canvas version history. Purely additive: a single new
-- table + FK + index; touches no existing table or data.

-- CreateTable
CREATE TABLE "BoardVersion" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "yjsState" BYTEA NOT NULL,
    "label" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardVersion_boardId_createdAt_idx" ON "BoardVersion"("boardId", "createdAt");

-- AddForeignKey
ALTER TABLE "BoardVersion" ADD CONSTRAINT "BoardVersion_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
