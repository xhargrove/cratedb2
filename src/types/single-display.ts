/** Row shape for singles grid/list (subset of DB). */
export type SingleDisplayRow = {
  id: string;
  artist: string;
  title: string;
  bSideTitle: string | null;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  artworkKey: string | null;
  artworkUpdatedAt: Date | null;
};
