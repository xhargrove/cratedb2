'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  applyMetadataCandidateAction,
  findMetadataCandidatesAction,
  type ApplyMetadataState,
  type FindMetadataState,
} from '@/server/actions/enrichment';

import type { MetadataCandidate } from '@/server/enrichment/types';

export function RecordEnrichmentPanel({
  recordId,
  enrichmentEnabled,
  disabledReason,
}: {
  recordId: string;
  enrichmentEnabled: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [findState, findAction, findPending] = useActionState<
    FindMetadataState,
    FormData
  >(findMetadataCandidatesAction, null);

  const [applyState, applyAction, applyPending] = useActionState<
    ApplyMetadataState,
    FormData
  >(applyMetadataCandidateAction, null);

  const [selected, setSelected] = useState<MetadataCandidate | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');

  useEffect(() => {
    setSelected(null);
  }, [findState]);

  useEffect(() => {
    if (applyState !== null && 'ok' in applyState && applyState.ok) {
      router.refresh();
    }
  }, [applyState, router]);

  if (!enrichmentEnabled) {
    return (
      <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          Metadata enrichment unavailable
        </p>
        <p className="mt-1">{disabledReason ?? 'Not configured.'}</p>
      </section>
    );
  }

  const candidates =
    findState && 'candidates' in findState ? findState.candidates : null;
  const findError = findState && 'error' in findState ? findState.error : null;
  const applyError =
    applyState && 'error' in applyState ? applyState.error : null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Optional metadata (MusicBrainz)
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Search happens only when you click the button — nothing runs in the
        background. Results are suggestions; choose how to apply them.
      </p>

      <form
        action={findAction}
        className="mt-3 flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="recordId" value={recordId} />
        <button
          type="submit"
          disabled={findPending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {findPending ? 'Searching…' : 'Find metadata'}
        </button>
      </form>

      {findError ? (
        <p
          className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          {findError}
        </p>
      ) : null}

      {candidates && candidates.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Matching releases (showing {candidates.length})
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer gap-2 rounded-md border border-zinc-200 p-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/80"
                >
                  <input
                    type="radio"
                    name="pick"
                    className="mt-1"
                    checked={selected?.id === c.id}
                    onChange={() => setSelected(c)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {c.artist} — {c.title}
                    </span>
                    {c.year != null ? (
                      <span className="ml-2 tabular-nums text-zinc-600 dark:text-zinc-400">
                        ({c.year})
                      </span>
                    ) : null}
                    {c.label ? (
                      <span className="mt-1 block truncate text-xs text-zinc-500">
                        Label: {c.label}
                      </span>
                    ) : null}
                    {c.genre ? (
                      <span className="mt-0.5 block truncate text-xs text-zinc-500">
                        Tag: {c.genre}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Apply mode
            </span>
            <label className="flex cursor-pointer gap-2">
              <input
                type="radio"
                name="modePick"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />
              <span>
                <strong>Merge</strong> — fill empty year and genre only; keeps
                your artist and title.
              </span>
            </label>
            <label className="flex cursor-pointer gap-2">
              <input
                type="radio"
                name="modePick"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              <span>
                <strong>Replace</strong> — overwrite artist, title, year, and
                genre from the selected release.
              </span>
            </label>
          </div>

          <form action={applyAction}>
            <input type="hidden" name="recordId" value={recordId} />
            <input type="hidden" name="mode" value={mode} />
            <input
              type="hidden"
              name="candidate"
              value={selected ? JSON.stringify(selected) : ''}
            />
            <button
              type="submit"
              disabled={applyPending || !selected}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {applyPending ? 'Applying…' : 'Apply selected'}
            </button>
          </form>

          {applyError ? (
            <p
              className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100"
              role="alert"
            >
              {applyError}
            </p>
          ) : null}

          {applyState !== null && 'ok' in applyState && applyState.ok ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              Applied. Saving metadata source on this record.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
