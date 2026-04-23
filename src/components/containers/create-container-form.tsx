'use client';

import { useActionState } from 'react';

import { createStorageContainerAction } from '@/server/actions/containers';

export function CreateContainerForm() {
  const [state, formAction, pending] = useActionState(
    createStorageContainerAction,
    null
  );

  return (
    <form action={formAction} className="grid max-w-lg gap-4">
      {state?.error ? (
        <p
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Name
        <input
          name="name"
          required
          maxLength={120}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="e.g. Living room shelf A"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Type
        <select
          name="kind"
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="SHELF">Shelf</option>
          <option value="BOX">Box</option>
          <option value="CRATE">Crate</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Location note (optional)
        <input
          name="locationNote"
          maxLength={500}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="Room, wall, rack…"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Custom image (optional)
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="text-sm file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-white file:px-2 file:py-1 dark:file:border-zinc-600 dark:file:bg-zinc-950"
        />
      </label>
      <p className="text-xs text-zinc-500">
        If you skip an image, the card uses a built-in icon for the type you pick.
        JPEG, PNG, WebP, or GIF · max 3MB
      </p>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Saving…' : 'Create container'}
      </button>
    </form>
  );
}
