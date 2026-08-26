-- CreateTable
CREATE TABLE "AiPointMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'L1',
    "historicalPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "completedProjects" INTEGER NOT NULL DEFAULT 0,
    "ledProjects" INTEGER NOT NULL DEFAULT 0,
    "highImpactProjects" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiPointEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "historicalDelta" INTEGER NOT NULL DEFAULT 0,
    "availableDelta" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "projectName" TEXT NOT NULL DEFAULT '',
    "operatorName" TEXT NOT NULL DEFAULT '公开登记',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiPointEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "AiPointMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AiPointMember_historicalPoints_idx" ON "AiPointMember"("historicalPoints");

-- CreateIndex
CREATE INDEX "AiPointMember_level_idx" ON "AiPointMember"("level");

-- CreateIndex
CREATE INDEX "AiPointEntry_memberId_createdAt_idx" ON "AiPointEntry"("memberId", "createdAt");
