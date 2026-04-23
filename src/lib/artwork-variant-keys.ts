/**
 * Stored alongside the DB `artworkKey` (original upload). Derivatives are WebP sidecars.
 *
 * Example: `owner1/rec1.jpg` → `owner1/rec1.thumb.webp`, `owner1/rec1.medium.webp`
 */
export function derivativeKeysForBaseKey(baseKey: string): {
  thumb: string;
  medium: string;
} {
  const lastSlash = baseKey.lastIndexOf('/');
  const dir = lastSlash >= 0 ? baseKey.slice(0, lastSlash + 1) : '';
  const file = lastSlash >= 0 ? baseKey.slice(lastSlash + 1) : baseKey;
  const dot = file.lastIndexOf('.');
  const stem = dot >= 0 ? file.slice(0, dot) : file;
  return {
    thumb: `${dir}${stem}.thumb.webp`,
    medium: `${dir}${stem}.medium.webp`,
  };
}

/** Original plus derivative keys — for delete/replace cleanup. */
export function allStoredKeysForArtworkBase(baseKey: string): string[] {
  const d = derivativeKeysForBaseKey(baseKey);
  return [baseKey, d.thumb, d.medium];
}
