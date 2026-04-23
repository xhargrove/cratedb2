'use client';

import { useActionState } from 'react';

import { deleteStorageContainerAction } from '@/server/actions/containers';

export function DeleteContainerForm({ containerId }: { containerId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteStorageContainerAction,
    null
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="containerId" value={containerId} />
      {state?.error ? (
        <p className="mb-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-zinc-950 dark:text-red-200 dark:hover:bg-red-950/40"
      >
        {pending ? 'Deleting…' : 'Delete container'}
      </button>
    </form>
  );
}
