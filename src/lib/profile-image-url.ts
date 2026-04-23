/** Public GET route for profile photos — cache-bust when image updates. */
export function profileImageUrl(
  userId: string,
  updatedAtMs: number | null
): string {
  const base = `/api/users/${userId}/profile-image`;
  if (updatedAtMs === null || updatedAtMs === undefined) return base;
  const t = Number.isFinite(updatedAtMs) ? updatedAtMs : 0;
  return `${base}?v=${t}`;
}
