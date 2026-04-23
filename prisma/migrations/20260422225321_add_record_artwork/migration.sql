-- AlterTable
ALTER TABLE "records" ADD COLUMN     "artworkKey" TEXT,
ADD COLUMN     "artworkMimeType" TEXT,
ADD COLUMN     "artworkUpdatedAt" TIMESTAMP(3);
