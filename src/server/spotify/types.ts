/** Album row returned to the UI after normalizing Spotify search JSON. */

export type SpotifyAlbumSummary = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  /** Best-effort cover URL from search results (for preview in the browser). */
  coverUrl: string | null;
  /**
   * Album `genres` from Spotify (often empty). When present, shown as a default
   * for the record genre field.
   */
  genreHint: string | null;
};
