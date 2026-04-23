-- Drop manual StorageContainer model; physical "containers" are derived from record structured storage.

-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT IF EXISTS "records_containerId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "records_containerId_idx";

-- AlterTable
ALTER TABLE "records" DROP COLUMN IF EXISTS "containerId";

-- DropTable
DROP TABLE IF EXISTS "storage_containers";

-- DropEnum
DROP TYPE IF EXISTS "StorageContainerKind";
