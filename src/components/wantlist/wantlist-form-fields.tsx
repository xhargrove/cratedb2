type Defaults = {
  artist?: string;
  title?: string;
  year?: number | null;
  genre?: string | null;
  notes?: string | null;
};

export function WantlistFormFields({ defaults }: { defaults?: Defaults }) {
  return (
    <>
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
