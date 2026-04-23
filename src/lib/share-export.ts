/** Filename from `Content-Disposition` when present (matches server `-partial` suffix). */
export function filenameFromContentDisposition(
  res: Response,
  fallback: string
): string {
  const cd = res.headers.get('Content-Disposition');
  if (!cd) return fallback;
  const quoted = cd.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const unquoted = cd.match(/filename=([^;\s]+)/i);
  if (unquoted?.[1]) return unquoted[1].replace(/^"|"$/g, '');
  return fallback;
}

export function fallbackExportFilename(
  filePrefix: string,
  format: 'csv' | 'txt' | 'pdf'
): string {
  const date = new Date().toISOString().slice(0, 10);
  const ext = format === 'txt' ? 'txt' : format;
  return `${filePrefix}-${date}.${ext}`;
}

export function mimeForExportFormat(format: 'csv' | 'txt' | 'pdf'): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv; charset=utf-8';
    default:
      return 'text/plain; charset=utf-8';
  }
}
