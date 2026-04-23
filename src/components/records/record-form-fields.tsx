import { RecordArtworkImage } from '@/components/records/record-artwork-image';

type Defaults = {
  artist?: string;
  title?: string;
  year?: number | null;
  genre?: string | null;
  storageLocation?: string | null;
  notes?: string | null;
};

export function RecordFormFields({
  defaults,
  artworkMode,
  artworkPreviewUrl,
  spotifyCoverPreviewUrl,
}: {
  defaults?: Defaults;
  artworkMode?: 'create' | 'edit';
  /** Current artwork URL for edit preview (authenticated API route). */
  artworkPreviewUrl?: string | null;
  /** Spotify album art URL when user picked a search result (browser preview only). */
  spotifyCoverPreviewUrl?: string | null;
}) {
  const showArtwork = artworkMode === 'create' || artworkMode === 'edit';

  return (
    <>
      {showArtwork ? (
        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Album artwork (optional)
          </span>
          {spotifyCoverPreviewUrl ? (
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN URL from API */}
              <img
                src={spotifyCoverPreviewUrl}
                alt=""
                className="h-24 w-24 shrink-0 rounded-md object-cover"
                width={96}
                height={96}
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {artworkMode === 'edit' && artworkPreviewUrl
                  ? 'Spotify cover — saving will replace your current artwork with this image unless you upload a different file below.'
                  : 'Spotify cover — it will be saved when you submit if you leave the file upload empty.'}
              </p>
            </div>
          ) : null}
          {artworkMode === 'edit' && artworkPreviewUrl ? (
            <div className="flex items-start gap-4">
              <RecordArtworkImage
                src={artworkPreviewUrl}
                alt="Current artwork"
                className="h-24 w-24 rounded-md"
                imgClassName="h-full w-full rounded-md object-cover"
              />
              <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" name="removeArtwork" value="1" />
                Remove current artwork
              </label>
            </div>
          ) : null}
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {artworkMode === 'edit' ? 'Replace with new image' : 'Upload image'}
            <input
              type="file"
              name="artwork"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-sm file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-white file:px-2 file:py-1 dark:file:border-zinc-600 dark:file:bg-zinc-950"
            />
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            JPEG, PNG, WebP, or GIF · max 3MB
          </p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Artist
          <input
            name="artist"
            required
            defaultValue={defaults?.artist ?? ''}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Artist name"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Album title
          <input
            name="title"
            required
            defaultValue={defaults?.title ?? ''}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Album title"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Year
          <input
            name="year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={defaults?.year ?? ''}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Genre
          <input
            name="genre"
            defaultValue={defaults?.genre ?? ''}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Storage
          <input
            name="storageLocation"
            defaultValue={defaults?.storageLocation ?? ''}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Optional"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ''}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="Optional"
        />
      </label>
    </>
  );
}
