-- CreateEnum
CREATE TYPE "PhysicalStorageKind" AS ENUM ('NONE', 'SHELF', 'CRATE', 'BOX');

-- AlterTable
ALTER TABLE "collection_singles" ADD COLUMN     "boxCustomLabel" TEXT,
ADD COLUMN     "boxNumber" INTEGER,
ADD COLUMN     "crateNumber" INTEGER,
ADD COLUMN     "shelfColumn" INTEGER,
ADD COLUMN     "shelfRow" INTEGER,
ADD COLUMN     "storageKind" "PhysicalStorageKind" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "collection_twelve_inch_singles" ADD COLUMN     "boxCustomLabel" TEXT,
ADD COLUMN     "boxNumber" INTEGER,
ADD COLUMN     "crateNumber" INTEGER,
ADD COLUMN     "shelfColumn" INTEGER,
ADD COLUMN     "shelfRow" INTEGER,
ADD COLUMN     "storageKind" "PhysicalStorageKind" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "records" ADD COLUMN     "boxCustomLabel" TEXT,
ADD COLUMN     "boxNumber" INTEGER,
ADD COLUMN     "crateNumber" INTEGER,
ADD COLUMN     "shelfColumn" INTEGER,
ADD COLUMN     "shelfRow" INTEGER,
ADD COLUMN     "storageKind" "PhysicalStorageKind" NOT NULL DEFAULT 'NONE';
