/** One row for owner export (CSV / TXT / PDF). */
export type SingleExportRow = {
  id: string;
  artist: string;
  title: string;
  bSideTitle: string | null;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  notes: string | null;
  quantity: number;
  spotifyTrackId: string | null;
  createdAt: Date;
};
