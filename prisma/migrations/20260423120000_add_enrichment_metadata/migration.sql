-- Optional metadata enrichment provenance (Phase 9).

ALTER TABLE "records" ADD COLUMN "metadataSource" TEXT;
ALTER TABLE "records" ADD COLUMN "metadataSourceId" TEXT;
ALTER TABLE "records" ADD COLUMN "metadataAppliedAt" TIMESTAMP(3);
