import {
  extensionForMime,
  type AllowedArtworkMimeType,
} from '@/lib/validations/artwork';

const SAFE_KEY_RE = /^[a-zA-Z0-9/_\-.]+$/;

function assertSegment(segment: string, label: string) {
  if (!segment || segment.includes('..') || segment.includes('/')) {
    throw new Error(`Invalid ${label} segment`);
  }
}

export function assertValidArtworkKey(key: string): string {
  if (!key || key.includes('..') || key.startsWith('/') || key.endsWith('/')) {
    throw new Error('Invalid artwork key');
  }
  if (!SAFE_KEY_RE.test(key)) {
    throw new Error('Invalid artwork key');
  }
  return key;
}

/** Relative key persisted in DB — never absolute paths. */
export function artworkRelativeKey(
  ownerId: string,
  recordId: string,
  mimeType: AllowedArtworkMimeType
): string {
  assertSegment(ownerId, 'ownerId');
  assertSegment(recordId, 'recordId');
  const ext = extensionForMime(mimeType);
  return `${ownerId}/${recordId}.${ext}`;
}

/** Avatar / profile photo — one file per user, stable basename. */
export function profileImageRelativeKey(
  userId: string,
  mimeType: AllowedArtworkMimeType
): string {
  assertSegment(userId, 'userId');
  const ext = extensionForMime(mimeType);
  return `${userId}/profile.${ext}`;
}

/** Key for 45 singles — isolated under `singles/` per owner to avoid clashes with album artwork keys. */
export function singleArtworkRelativeKey(
  ownerId: string,
  singleId: string,
  mimeType: AllowedArtworkMimeType
): string {
  assertSegment(ownerId, 'ownerId');
  assertSegment(singleId, 'singleId');
  const ext = extensionForMime(mimeType);
  return `${ownerId}/singles/${singleId}.${ext}`;
}

/** Key for 12-inch singles — separate folder from 45s and albums. */
export function twelveInchArtworkRelativeKey(
  ownerId: string,
  twelveInchId: string,
  mimeType: AllowedArtworkMimeType
): string {
  assertSegment(ownerId, 'ownerId');
  assertSegment(twelveInchId, 'twelveInchId');
  const ext = extensionForMime(mimeType);
  return `${ownerId}/twelve-inch/${twelveInchId}.${ext}`;
}
