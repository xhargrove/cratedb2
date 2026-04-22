/** Slim row shape for collection presentation (maps from CollectionRecord). */
export type RecordDisplayRow = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
};
