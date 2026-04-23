/** Max artwork upload size (aligned with Next serverActions body limit). */
export const MAX_ARTWORK_BYTES = 3 * 1024 * 1024;

export const ALLOWED_ARTWORK_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedArtworkMimeType =
  (typeof ALLOWED_ARTWORK_MIME_TYPES)[number];

const MIME_TO_EXT: Record<AllowedArtworkMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** File extension fragment for stored filename (no dot). */
export function extensionForMime(mime: AllowedArtworkMimeType): string {
  return MIME_TO_EXT[mime];
}

function isAllowedMime(m: string): m is AllowedArtworkMimeType {
  return (ALLOWED_ARTWORK_MIME_TYPES as readonly string[]).includes(m);
}

/**
 * Detect image type from magic bytes only (do not trust Content-Type / filename).
 */
export function detectArtworkMimeFromBytes(
  buf: Uint8Array
): AllowedArtworkMimeType | null {
  if (buf.length < 3) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (buf.length >= 6) {
    const header = String.fromCharCode(
      buf[0],
      buf[1],
      buf[2],
      buf[3],
      buf[4],
      buf[5]
    );
    if (header === 'GIF87a' || header === 'GIF89a') {
      return 'image/gif';
    }
  }

  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export type ParsedArtworkUpload =
  | { ok: true; kind: 'absent' }
  | {
      ok: true;
      kind: 'present';
      buffer: Buffer;
      mimeType: AllowedArtworkMimeType;
    }
  | { ok: false; error: string };

/**
 * Parse optional `File` from FormData (server). Validates size + magic bytes.
 */
export async function parseArtworkFileUpload(
  file: unknown,
  maxBytes: number = MAX_ARTWORK_BYTES
): Promise<ParsedArtworkUpload> {
  if (file === undefined || file === null || file === '') {
    return { ok: true, kind: 'absent' };
  }

  if (typeof file === 'string') {
    return { ok: false, error: 'Invalid upload payload.' };
  }

  const f = file as File;
  if (typeof f.arrayBuffer !== 'function') {
    return { ok: false, error: 'Invalid upload payload.' };
  }

  if (f.size === 0) {
    return { ok: false, error: 'Image file is empty.' };
  }

  if (f.size > maxBytes) {
    return {
      ok: false,
      error: `Image must be at most ${Math.floor(maxBytes / (1024 * 1024))}MB.`,
    };
  }

  const ab = await f.arrayBuffer();
  const buf = Buffer.from(ab);

  if (buf.length > maxBytes) {
    return {
      ok: false,
      error: `Image must be at most ${Math.floor(maxBytes / (1024 * 1024))}MB.`,
    };
  }

  const detected = detectArtworkMimeFromBytes(buf);
  if (!detected || !isAllowedMime(detected)) {
    return {
      ok: false,
      error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.',
    };
  }

  return { ok: true, kind: 'present', buffer: buf, mimeType: detected };
}
