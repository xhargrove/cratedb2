-- CreateEnum
CREATE TYPE "StorageContainerKind" AS ENUM ('SHELF', 'BOX', 'CRATE');

-- CreateTable
CREATE TABLE "storage_containers" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "StorageContainerKind" NOT NULL,
    "locationNote" TEXT,
    "imageKey" TEXT,
    "imageMimeType" TEXT,
    "imageUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_containers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storage_containers_ownerId_idx" ON "storage_containers"("ownerId");

-- AddForeignKey
ALTER TABLE "storage_containers" ADD CONSTRAINT "storage_containers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "records" ADD COLUMN "containerId" TEXT;

-- CreateIndex
CREATE INDEX "records_containerId_idx" ON "records"("containerId");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "storage_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
