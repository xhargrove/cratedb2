-- Copies per collection row (album or single).

ALTER TABLE "records" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "records" ADD CONSTRAINT "records_quantity_check" CHECK ("quantity" >= 1 AND "quantity" <= 999);

ALTER TABLE "collection_singles" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "collection_singles" ADD CONSTRAINT "collection_singles_quantity_check" CHECK ("quantity" >= 1 AND "quantity" <= 999);
