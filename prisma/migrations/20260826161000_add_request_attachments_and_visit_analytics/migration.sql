-- AlterTable
ALTER TABLE "AiDemandRequest" ADD COLUMN "attachments" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "VisitRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL DEFAULT '',
    "referrer" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "VisitRecord_startedAt_idx" ON "VisitRecord"("startedAt");
CREATE INDEX "VisitRecord_ipAddress_startedAt_idx" ON "VisitRecord"("ipAddress", "startedAt");
CREATE INDEX "VisitRecord_path_startedAt_idx" ON "VisitRecord"("path", "startedAt");
CREATE INDEX "VisitRecord_sessionId_startedAt_idx" ON "VisitRecord"("sessionId", "startedAt");
