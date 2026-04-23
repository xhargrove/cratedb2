'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  assignRecordToContainerAction,
  removeRecordFromContainerAction,
} from '@/server/actions/containers';

type Assignable = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  containerId: string | null;
};

type InContainer = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  quantity: number;
};

export function ContainerRecordAssignPanel({
  containerId,
  assignable,
  inContainer,
}: {
  containerId: string;
  assignable: Assignable[];
  inContainer: InContainer[];
}) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignRecordToContainerAction,
    null
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeRecordFromContainerAction,
    null
  );

  const router = useRouter();
  const prevAssignPending = useRef(assignPending);
  const prevRemovePending = useRef(removePending);
  useEffect(() => {
    const assignDone =
      prevAssignPending.current && !assignPending && !assignState?.error;
    const removeDone =
      prevRemovePending.current && !removePending && !removeState?.error;
    if (assignDone || removeDone) {
      router.refresh();
    }
    prevAssignPending.current = assignPending;
    prevRemovePending.current = removePending;
  }, [
    assignPending,
    assignState?.error,
    removePending,
    removeState?.error,
    router,
  ]);

  const assignableKey = useMemo(
    () => assignable.map((r) => r.id).join(','),
    [assignable]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          In this container ({inContainer.length})
        </h2>
        {removeState?.error ? (
          <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
            {removeState.error}
          </p>
        ) : null}
        {inContainer.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No records yet. Add albums from the list on the right or from a record’s
            edit form.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {inContainer.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/records/${r.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {r.artist} — {r.title}
                  </Link>
                  {r.year != null ? (
                    <span className="ml-2 text-xs text-zinc-500">({r.year})</span>
                  ) : null}
                </div>
                <form action={removeAction}>
                  <input type="hidden" name="containerId" value={containerId} />
                  <input type="hidden" name="recordId" value={r.id} />
                  <button
                    type="submit"
                    disabled={removePending}
                    className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Add from collection
        </h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Up to {assignable.length} shown (same cap as your records list). Records
          already here are hidden.
        </p>
        {assignState?.error ? (
          <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
            {assignState.error}
          </p>
        ) : null}
        {assignable.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Every record in your collection is already in this container, or you have
            no other records yet.
          </p>
        ) : (
          <ul
            key={assignableKey}
            className="mt-3 max-h-80 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800"
          >
            {assignable.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {r.artist} — {r.title}
                  </span>
                  {r.year != null ? (
                    <span className="ml-2 text-xs text-zinc-500">({r.year})</span>
                  ) : null}
                  {r.containerId ? (
                    <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-400">
                      Currently in another container — moving here will reassign it.
                    </span>
                  ) : null}
                </div>
                <form action={assignAction}>
                  <input type="hidden" name="containerId" value={containerId} />
                  <input type="hidden" name="recordId" value={r.id} />
                  <button
                    type="submit"
                    disabled={assignPending}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Add here
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
