-- CreateTable
CREATE TABLE "wantlist_items" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "genre" TEXT,
    "notes" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wantlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wantlist_items_ownerId_idx" ON "wantlist_items"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "wantlist_items_ownerId_dedupeKey_key" ON "wantlist_items"("ownerId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "wantlist_items" ADD CONSTRAINT "wantlist_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
