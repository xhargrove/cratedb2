-- 12-inch singles / maxis — parallel to collection_singles (45s).

CREATE TABLE "collection_twelve_inch_singles" (
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
    "spotifyTrackId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_twelve_inch_singles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "collection_twelve_inch_singles_quantity_check" CHECK ("quantity" >= 1 AND "quantity" <= 999)
);

CREATE INDEX "collection_twelve_inch_singles_ownerId_idx" ON "collection_twelve_inch_singles"("ownerId");

ALTER TABLE "collection_twelve_inch_singles" ADD CONSTRAINT "collection_twelve_inch_singles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
