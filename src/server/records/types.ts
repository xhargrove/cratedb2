import type { RecordWriteFields } from '@/lib/validations/record';

/** Payload for DB writes after validation (ownerId added by service). */
export type RecordWriteInput = RecordWriteFields;
