/** One album row for owner export (CSV / TXT / PDF). */
export type RecordExportRow = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  notes: string | null;
  quantity: number;
  spotifyAlbumId: string | null;
  metadataSource: string | null;
  metadataSourceId: string | null;
  createdAt: Date;
};
