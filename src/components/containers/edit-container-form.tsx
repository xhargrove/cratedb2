'use client';

import { useActionState } from 'react';

import { containerImageUrl } from '@/lib/container-image-url';
import type { StorageContainerKind } from '@/generated/prisma/client';
import { updateStorageContainerAction } from '@/server/actions/containers';

type Row = {
  id: string;
  name: string;
  kind: StorageContainerKind;
  locationNote: string | null;
  imageKey: string | null;
  imageUpdatedAt: Date | string | null;
};

export function EditContainerForm({ container }: { container: Row }) {
  const [state, formAction, pending] = useActionState(
    updateStorageContainerAction,
    null
  );

  const preview = containerImageUrl(
    container.id,
    Boolean(container.imageKey),
    container.imageUpdatedAt
  );

  return (
    <form action={formAction} className="grid max-w-lg gap-4">
      <input type="hidden" name="containerId" value={container.id} />
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
          defaultValue={container.name}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Type
        <select
          name="kind"
          defaultValue={container.kind}
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
          defaultValue={container.locationNote ?? ''}
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      {preview ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-20 w-20 rounded-md object-cover"
            width={80}
            height={80}
          />
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" name="removeImage" value="1" />
            Remove current image
          </label>
        </div>
      ) : null}
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Replace image (optional)
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="text-sm file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-white file:px-2 file:py-1 dark:file:border-zinc-600 dark:file:bg-zinc-950"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
