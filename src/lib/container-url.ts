/**
 * Stable path for a virtual container (physical storage slot) in the dashboard.
 * `slotKey` is base64url JSON from {@link encodePhysicalSlotKey}.
 */
export function containerDashboardPath(slotKey: string): string {
  return `/dashboard/containers/${slotKey}`;
}

/** Absolute URL for QR scans — encodes slot only, not record payloads. */
export function buildContainerScanUrl(origin: string, slotKey: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${containerDashboardPath(slotKey)}`;
}
