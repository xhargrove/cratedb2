/** Row shape for singles grid/list (subset of DB). */
export type SingleDisplayRow = {
  id: string;
  artist: string;
  title: string;
  bSideTitle: string | null;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  /** Physical copies of this single (same row). */
  quantity: number;
  artworkKey: string | null;
  artworkUpdatedAt: Date | null;
};
