'use server';

import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
import { parseRecordId } from '@/lib/validations/record';
import { requireUserForServerAction } from '@/server/auth/action-auth-gate';
import { getEnrichmentConfig } from '@/server/enrichment/config';
import { metadataCandidateSchema } from '@/server/enrichment/candidate-schema';
import {
  applyMetadataCandidateForRecord,
  type ApplyMode,
} from '@/server/enrichment/apply-candidate';
import { enrichCandidateGenreBeforeApply } from '@/server/enrichment/enrich-candidate-genre';
import { findMetadataCandidatesForRecord } from '@/server/enrichment/find-candidates';
import type { MetadataCandidate } from '@/server/enrichment/types';

export type FindMetadataState =
  | null
  | { error: string }
  | { candidates: MetadataCandidate[] };

export type ApplyMetadataState = null | { error: string } | { ok: true };

function revalidateRecord(recordId: string) {
  revalidatePath('/dashboard/records');
  revalidatePath(`/dashboard/records/${recordId}`);
  revalidatePath(`/dashboard/records/${recordId}/edit`);
}

export async function findMetadataCandidatesAction(
  _prev: FindMetadataState,
  formData: FormData
): Promise<FindMetadataState> {
  const auth = await requireUserForServerAction();
  if (!auth.ok) return { error: auth.error };
  const user = auth.user;

  const idParsed = parseRecordId(formData.get('recordId'));
  if (!idParsed.ok) {
    return { error: idParsed.error };
  }

  const enrichmentCfg = getEnrichmentConfig();
  if (!enrichmentCfg.enabled) {
    return { error: enrichmentCfg.reason };
  }

  try {
    const result = await findMetadataCandidatesForRecord({
      recordId: idParsed.id,
      ownerId: user.id,
    });

    if (!result.ok) {
      return { error: result.error };
    }

    if (result.candidates.length === 0) {
      return {
        error:
          'No matching releases found. Adjust artist or title on this record and try again.',
      };
    }

    return { candidates: result.candidates };
  } catch (e) {
    logger.error({ err: e, recordId: idParsed.id }, 'findMetadataCandidates');
    return { error: 'Something went wrong while searching.' };
  }
}

export async function applyMetadataCandidateAction(
  _prev: ApplyMetadataState,
  formData: FormData
): Promise<ApplyMetadataState> {
  const auth = await requireUserForServerAction();
  if (!auth.ok) return { error: auth.error };
  const user = auth.user;

  const idParsed = parseRecordId(formData.get('recordId'));
  if (!idParsed.ok) {
    return { error: idParsed.error };
  }

  const enrichmentCfg = getEnrichmentConfig();
  if (!enrichmentCfg.enabled) {
    return { error: enrichmentCfg.reason };
  }

  const modeRaw = formData.get('mode');
  const mode: ApplyMode = modeRaw === 'replace' ? 'replace' : 'merge';

  const rawJson = formData.get('candidate');
  if (typeof rawJson !== 'string' || rawJson.trim() === '') {
    return { error: 'Select a candidate before applying.' };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch {
    return { error: 'Invalid candidate payload.' };
  }

  const parsed = metadataCandidateSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { error: 'Candidate data could not be validated.' };
  }

  try {
    const candidateWithGenre = await enrichCandidateGenreBeforeApply({
      candidate: parsed.data,
      userAgent: enrichmentCfg.musicbrainzUserAgent,
    });

    const applied = await applyMetadataCandidateForRecord({
      recordId: idParsed.id,
      ownerId: user.id,
      candidate: candidateWithGenre,
      mode,
    });

    if (!applied.ok) {
      return { error: applied.error };
    }

    revalidateRecord(idParsed.id);
    return { ok: true };
  } catch (e) {
    logger.error({ err: e, recordId: idParsed.id }, 'applyMetadataCandidate');
    return { error: 'Could not apply metadata.' };
  }
}
