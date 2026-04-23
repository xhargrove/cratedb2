import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';
import {
  allStoredKeysForArtworkBase,
  derivativeKeysForBaseKey,
} from '@/lib/artwork-variant-keys';
import { generateArtworkDerivatives } from '@/server/storage/artwork-derivatives';
import {
  deleteArtworkObject,
  writeArtworkObject,
} from '@/server/storage/artwork-store';

/** Persist original upload plus WebP thumb/medium sidecars when generation succeeds. */
export async function writeArtworkBundle(
  baseKey: string,
  buffer: Buffer,
  mimeType: AllowedArtworkMimeType
): Promise<void> {
  await writeArtworkObject(baseKey, buffer, mimeType);

  const derived = await generateArtworkDerivatives(buffer);
  if (!derived) return;

  const { thumb, medium } = derivativeKeysForBaseKey(baseKey);
  await writeArtworkObject(thumb, derived.thumb, 'image/webp');
  await writeArtworkObject(medium, derived.medium, 'image/webp');
}

/** Remove original and all derivative objects for one logical artwork. */
export async function deleteArtworkBundle(
  baseKey: string | null
): Promise<void> {
  if (!baseKey) return;
  await Promise.all(
    allStoredKeysForArtworkBase(baseKey).map((k) =>
      deleteArtworkObject(k).catch(() => {})
    )
  );
}
