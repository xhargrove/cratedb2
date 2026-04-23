-- CreateTable
CREATE TABLE "collection_singles" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bSideTitle" TEXT,
    "year" INTEGER,
    "genre" TEXT,
    "storageLocation" TEXT,
    "notes" TEXT,
    "artworkKey" TEXT,
    "artworkMimeType" TEXT,
    "artworkUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_singles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collection_singles_ownerId_idx" ON "collection_singles"("ownerId");

-- AddForeignKey
ALTER TABLE "collection_singles" ADD CONSTRAINT "collection_singles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
