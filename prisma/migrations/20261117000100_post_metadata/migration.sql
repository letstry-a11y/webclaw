-- Older migration-based installations lack these fields used by posts and recruitment.
ALTER TABLE "Post" ADD COLUMN "authorFingerprint" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Post" ADD COLUMN "attachments" TEXT NOT NULL DEFAULT '';
