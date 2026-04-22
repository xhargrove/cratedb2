'use client';

import { useActionState } from 'react';

import { updateRecordAction } from '@/server/actions/records';

import { RecordFormFields } from '@/components/records/record-form-fields';

type RecordRow = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  storageLocation: string | null;
  notes: string | null;
};

export function EditRecordForm({ record }: { record: RecordRow }) {
  const [state, formAction, pending] = useActionState(updateRecordAction, null);

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="recordId" value={record.id} />
      {state?.error ? (
        <p
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <RecordFormFields
        defaults={{
          artist: record.artist,
          title: record.title,
          year: record.year,
          genre: record.genre,
          storageLocation: record.storageLocation,
          notes: record.notes,
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
