-- Bring migration-based installations in line with the existing Docker schema.
ALTER TABLE "AiDemandRequest" ADD COLUMN "committeeAssistant" TEXT NOT NULL DEFAULT '';
