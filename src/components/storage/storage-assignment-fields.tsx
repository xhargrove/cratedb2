'use client';

import { useMemo, useState } from 'react';

import type { PhysicalStorageKind } from '@/generated/prisma/client';

import {
  STORAGE_BOX_NUMBER_MAX,
  STORAGE_CRATE_MAX,
  STORAGE_SHELF_COLUMN_MAX,
  STORAGE_SHELF_ROW_MAX,
} from '@/lib/storage-constants';
import type { StorageAssignmentDefaults } from '@/lib/storage-form-defaults';

export type { StorageAssignmentDefaults };

/**
 * `album` — neutral order in the type dropdown.
 * `single` — boxes first (suited to 45s / singles filing).
 */
export function StorageAssignmentFields({
  variant,
  defaults,
}: {
  variant: 'album' | 'single';
  defaults?: StorageAssignmentDefaults;
}) {
  const initialKind = defaults?.storageKind ?? 'NONE';
  const [kind, setKind] = useState<PhysicalStorageKind>(initialKind);

  const initialBoxPreset = useMemo(() => {
    if (defaults?.boxCustomLabel?.trim()) return 'custom';
    if (defaults?.boxNumber != null) return String(defaults.boxNumber);
    return '';
  }, [defaults?.boxCustomLabel, defaults?.boxNumber]);

  const [boxPreset, setBoxPreset] = useState(initialBoxPreset);

  const kindOptions =
    variant === 'single'
      ? [
          { value: 'NONE', label: 'Not set' },
          { value: 'BOX', label: 'Box' },
          { value: 'SHELF', label: 'Shelf (row & column)' },
          { value: 'CRATE', label: 'Crate' },
        ]
      : [
          { value: 'NONE', label: 'Not set' },
          { value: 'SHELF', label: 'Shelf (row & column)' },
          { value: 'CRATE', label: 'Crate' },
          { value: 'BOX', label: 'Box' },
        ];

  const crateValues = useMemo(
    () => Array.from({ length: STORAGE_CRATE_MAX }, (_, i) => i + 1),
    []
  );

  const boxNumberValues = useMemo(
    () => Array.from({ length: STORAGE_BOX_NUMBER_MAX }, (_, i) => i + 1),
    []
  );

  const showLegacyHint =
    kind === 'NONE' &&
    Boolean(defaults?.legacyStorageLocation?.trim());

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Storage (optional)
      </span>

      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Type
        <select
          name="storageKind"
          value={kind}
          onChange={(e) =>
            setKind(e.target.value as PhysicalStorageKind)
          }
          className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          {kindOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {showLegacyHint ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Saved text from before structured storage:{' '}
          <span className="font-medium">{defaults!.legacyStorageLocation}</span>.
          Pick Shelf, Crate, or Box above to replace it — saving with “Not set”
          clears this text.
        </p>
      ) : null}

      {kind === 'NONE' ? (
        <>
          <input type="hidden" name="shelfRow" value="" />
          <input type="hidden" name="shelfColumn" value="" />
          <input type="hidden" name="crateNumber" value="" />
          <input type="hidden" name="boxPreset" value="" />
          <input type="hidden" name="boxCustomLabel" value="" />
        </>
      ) : null}

      {kind === 'SHELF' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Row (1–{STORAGE_SHELF_ROW_MAX})
              <input
                name="shelfRow"
                type="number"
                min={1}
                max={STORAGE_SHELF_ROW_MAX}
                required
                defaultValue={defaults?.shelfRow ?? ''}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Column (1–{STORAGE_SHELF_COLUMN_MAX})
              <input
                name="shelfColumn"
                type="number"
                min={1}
                max={STORAGE_SHELF_COLUMN_MAX}
                required
                defaultValue={defaults?.shelfColumn ?? ''}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
          </div>
          <input type="hidden" name="crateNumber" value="" />
          <input type="hidden" name="boxPreset" value="" />
          <input type="hidden" name="boxCustomLabel" value="" />
        </>
      ) : null}

      {kind === 'CRATE' ? (
        <>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Crate
            <select
              name="crateNumber"
              required
              defaultValue={
                defaults?.crateNumber != null
                  ? String(defaults.crateNumber)
                  : ''
              }
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              <option value="">Choose…</option>
              {crateValues.map((n) => (
                <option key={n} value={n}>
                  Crate {n}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="shelfRow" value="" />
          <input type="hidden" name="shelfColumn" value="" />
          <input type="hidden" name="boxPreset" value="" />
          <input type="hidden" name="boxCustomLabel" value="" />
        </>
      ) : null}

      {kind === 'BOX' ? (
        <>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Box
              <select
                name="boxPreset"
                value={boxPreset}
                required
                onChange={(e) => setBoxPreset(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">Choose…</option>
                {boxNumberValues.map((n) => (
                  <option key={n} value={String(n)}>
                    Box {n}
                  </option>
                ))}
                <option value="custom">Custom…</option>
              </select>
            </label>
            {boxPreset === 'custom' ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Custom label
                <input
                  name="boxCustomLabel"
                  defaultValue={defaults?.boxCustomLabel ?? ''}
                  className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="e.g. Lounge rack, tour bin"
                />
              </label>
            ) : (
              <input type="hidden" name="boxCustomLabel" value="" />
            )}
          </div>
          <input type="hidden" name="shelfRow" value="" />
          <input type="hidden" name="shelfColumn" value="" />
          <input type="hidden" name="crateNumber" value="" />
        </>
      ) : null}
    </div>
  );
}
