/** Derive two-letter initials for the public profile avatar from the visible name. */
export function initialsFromDisplayLabel(label: string): string {
  const trimmed = label.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}
