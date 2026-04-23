/**
 * Stable path for a container in the authenticated dashboard.
 * QR codes encode an absolute URL built from {@link resolvePublicAppOrigin}.
 */
export function containerDashboardPath(containerId: string): string {
  return `/dashboard/containers/${containerId}`;
}

/** Absolute URL scanned by QR codes (no embedded inventory — live page only). */
export function buildContainerScanUrl(origin: string, containerId: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${containerDashboardPath(containerId)}`;
}
