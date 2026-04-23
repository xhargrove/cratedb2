'use client';

import { useActionState } from 'react';

import type { PhysicalStorageKind } from '@/generated/prisma/client';
import { twelveInchArtworkUrl } from '@/lib/twelve-inch-artwork-url';
import { storageAssignmentDefaultsFromRow } from '@/lib/storage-form-defaults';
import { updateTwelveInchAction } from '@/server/actions/twelve-inch-singles';

import { TwelveInchFormFields } from '@/components/twelve-inch/twelve-inch-form-fields';

type Row = {
  id: string;
  artist: string;
  title: string;
  bSideTitle: string | null;
  year: number | null;
  quantity: number;
  genre: string | null;
  storageKind: PhysicalStorageKind;
  shelfRow: number | null;
  shelfColumn: number | null;
  crateNumber: number | null;
  boxNumber: number | null;
  boxCustomLabel: string | null;
  storageLocation: string | null;
  notes: string | null;
  artworkKey: string | null;
  artworkUpdatedAt: Date | string | null;
};

export function EditTwelveInchForm({ row }: { row: Row }) {
  const [state, formAction, pending] = useActionState(
    updateTwelveInchAction,
    null
  );

  const artworkPreviewUrl = twelveInchArtworkUrl(
    row.id,
    Boolean(row.artworkKey),
    row.artworkUpdatedAt
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="twelveInchId" value={row.id} />
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Edit 12-inch single
      </h2>
      {state?.error ? (
        <p
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <TwelveInchFormFields
        artworkMode="edit"
        artworkPreviewUrl={artworkPreviewUrl}
        defaults={{
          artist: row.artist,
          title: row.title,
          bSideTitle: row.bSideTitle,
          year: row.year,
          quantity: row.quantity,
          genre: row.genre,
          storage: storageAssignmentDefaultsFromRow(row),
          notes: row.notes,
        }}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
