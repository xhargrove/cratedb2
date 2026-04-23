-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "profileImageKey" TEXT,
ADD COLUMN "profileImageMimeType" TEXT,
ADD COLUMN "profileImageUpdatedAt" TIMESTAMP(3);
