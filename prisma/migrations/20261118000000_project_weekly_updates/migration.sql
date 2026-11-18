CREATE TABLE "AiWeeklyUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT,
    "projectId" TEXT,
    "weekStart" TEXT NOT NULL,
    "achievement" TEXT NOT NULL,
    "nextStep" TEXT NOT NULL,
    "blocker" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiWeeklyUpdate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiDemandRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiWeeklyUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AiProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiWeeklyUpdate_requestId_weekStart_key" ON "AiWeeklyUpdate"("requestId", "weekStart");
CREATE UNIQUE INDEX "AiWeeklyUpdate_projectId_weekStart_key" ON "AiWeeklyUpdate"("projectId", "weekStart");
CREATE INDEX "AiWeeklyUpdate_weekStart_idx" ON "AiWeeklyUpdate"("weekStart");
