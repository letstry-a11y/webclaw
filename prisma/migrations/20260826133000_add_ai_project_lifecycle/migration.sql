-- CreateTable
CREATE TABLE "AiDemandRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterDepartment" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "currentProblem" TEXT NOT NULL,
    "desiredFunctions" TEXT NOT NULL,
    "businessValue" TEXT NOT NULL,
    "expectedDeliverables" TEXT NOT NULL,
    "targetDate" DATETIME,
    "availableResources" TEXT NOT NULL DEFAULT '',
    "dataSensitivity" TEXT NOT NULL DEFAULT 'internal',
    "recruitmentRoles" TEXT NOT NULL DEFAULT '',
    "weeklyCommitment" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "projectLevel" INTEGER,
    "basePointPool" INTEGER,
    "reviewComment" TEXT NOT NULL DEFAULT '',
    "reviewedBy" TEXT NOT NULL DEFAULT '',
    "reviewedAt" DATETIME,
    "recruitmentDeadline" DATETIME,
    "plannedTeamSize" INTEGER NOT NULL DEFAULT 0,
    "warrantyMonths" INTEGER NOT NULL DEFAULT 3,
    "activityPostId" TEXT,
    "score" INTEGER,
    "effectCoefficient" REAL,
    "finalPointPool" INTEGER,
    "allocationNote" TEXT NOT NULL DEFAULT '',
    "pointsApprovedBy" TEXT NOT NULL DEFAULT '',
    "pointsApprovedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiDemandRequest_activityPostId_fkey" FOREIGN KEY ("activityPostId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "businessImpact" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "releasePlan" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "requestId" TEXT,
    CONSTRAINT "AiProject_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiDemandRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AiProject" ("businessImpact", "createdAt", "id", "name", "order", "owner", "releasePlan", "status", "subtitle", "updatedAt") SELECT "businessImpact", "createdAt", "id", "name", "order", "owner", "releasePlan", "status", "subtitle", "updatedAt" FROM "AiProject";
DROP TABLE "AiProject";
ALTER TABLE "new_AiProject" RENAME TO "AiProject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- AlterTable
ALTER TABLE "AiPointMember" ADD COLUMN "email" TEXT;

-- CreateTable
CREATE TABLE "AiProjectApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "intendedRole" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "weeklyAvailability" TEXT NOT NULL,
    "statement" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiProjectApplication_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiDemandRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiProjectTeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "responsibility" TEXT NOT NULL DEFAULT '',
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiProjectTeamMember_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiDemandRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiProjectTeamMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AiProjectApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiProjectPointAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "proposedPoints" INTEGER NOT NULL,
    "issuedPoints" INTEGER NOT NULL DEFAULT 0,
    "warrantyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiProjectPointAllocation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiDemandRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiProjectPointAllocation_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "AiProjectTeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiWorkflowLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiWorkflowLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AiDemandRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AiDemandRequest_activityPostId_key" ON "AiDemandRequest"("activityPostId");
CREATE INDEX "AiDemandRequest_status_createdAt_idx" ON "AiDemandRequest"("status", "createdAt");
CREATE INDEX "AiDemandRequest_requesterEmail_idx" ON "AiDemandRequest"("requesterEmail");
CREATE UNIQUE INDEX "AiProject_requestId_key" ON "AiProject"("requestId");
CREATE UNIQUE INDEX "AiPointMember_email_key" ON "AiPointMember"("email");
CREATE UNIQUE INDEX "AiProjectApplication_requestId_email_key" ON "AiProjectApplication"("requestId", "email");
CREATE INDEX "AiProjectApplication_requestId_status_idx" ON "AiProjectApplication"("requestId", "status");
CREATE UNIQUE INDEX "AiProjectTeamMember_applicationId_key" ON "AiProjectTeamMember"("applicationId");
CREATE UNIQUE INDEX "AiProjectTeamMember_requestId_email_key" ON "AiProjectTeamMember"("requestId", "email");
CREATE INDEX "AiProjectTeamMember_requestId_isLead_idx" ON "AiProjectTeamMember"("requestId", "isLead");
CREATE UNIQUE INDEX "AiProjectPointAllocation_teamMemberId_key" ON "AiProjectPointAllocation"("teamMemberId");
CREATE INDEX "AiProjectPointAllocation_requestId_idx" ON "AiProjectPointAllocation"("requestId");
CREATE INDEX "AiWorkflowLog_requestId_createdAt_idx" ON "AiWorkflowLog"("requestId", "createdAt");
