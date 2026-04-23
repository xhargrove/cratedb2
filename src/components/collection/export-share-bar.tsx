'use client';

import { useCallback, useRef, useState } from 'react';

import {
  fallbackExportFilename,
  filenameFromContentDisposition,
  mimeForExportFormat,
} from '@/lib/share-export';

const btn =
  'rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-2 dark:hover:bg-zinc-800';

type Props = {
  apiBase: string;
  /** Base name without extension, e.g. `cratedb-records` (must match export route filenames). */
  filePrefix: string;
};

function canShareFile(file: File): boolean {
  try {
    return Boolean(
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

/**
 * Download links plus **Share…** using the Web Share API (Messages, AirDrop, Mail,
 * Files, etc., where the OS supports sharing files). Falls back to downloading
 * a copy when needed.
 */
export function ExportShareBar({ apiBase, filePrefix }: Props) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [busy, setBusy] = useState<'csv' | 'txt' | 'pdf' | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, []);

  const shareOrDownload = useCallback(
    async (format: 'csv' | 'txt' | 'pdf') => {
      setHint(null);
      setBusy(format);
      const url = `${apiBase}?format=${format}`;
      const fallbackName = fallbackExportFilename(filePrefix, format);
      const mime = mimeForExportFormat(format);

      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) {
          setHint(
            res.status === 401
              ? 'Sign in required.'
              : 'Could not prepare export.'
          );
          return;
        }

        const blob = await res.blob();
        const filename = filenameFromContentDisposition(res, fallbackName);
        const file = new File([blob], filename, { type: mime });

        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' &&
          canShareFile(file)
        ) {
          try {
            await navigator.share({
              files: [file],
              title: 'Cratedb export',
              text: `Collection export (${format.toUpperCase()})`,
            });
          } catch (e) {
            if ((e as Error).name === 'AbortError') {
              return;
            }
            triggerDownload(blob, filename);
            setHint('Saved a copy — sharing was cancelled or failed.');
          }
          return;
        }

        triggerDownload(blob, filename);
        if (!navigator.share) {
          setHint(
            'Downloaded — on mobile, open the file from Downloads and use Share.'
          );
        } else {
          setHint(
            'Downloaded — this environment cannot open the system share sheet for files; use your device Share menu on the saved file.'
          );
        }
      } catch {
        setHint('Something went wrong. Try downloading instead.');
      } finally {
        setBusy(null);
        closeMenu();
      }
    },
    [apiBase, filePrefix, closeMenu]
  );

  return (
    <div className="flex flex-col items-end gap-2 sm:items-start">
      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 text-sm sm:justify-start">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">
          Export
        </span>
        <a href={`${apiBase}?format=csv`} className={btn}>
          CSV
        </a>
        <a href={`${apiBase}?format=txt`} className={btn}>
          TXT
        </a>
        <a href={`${apiBase}?format=pdf`} className={btn}>
          PDF
        </a>

        <details ref={menuRef} className="group relative">
          <summary
            className={`${btn} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}
          >
            Share…
          </summary>
          <div className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              disabled={busy !== null}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              onClick={() => void shareOrDownload('csv')}
            >
              {busy === 'csv' ? 'Preparing…' : 'Share CSV'}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              onClick={() => void shareOrDownload('txt')}
            >
              {busy === 'txt' ? 'Preparing…' : 'Share TXT'}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              onClick={() => void shareOrDownload('pdf')}
            >
              {busy === 'pdf' ? 'Preparing…' : 'Share PDF'}
            </button>
          </div>
        </details>
      </div>
      {hint ? (
        <p
          className="max-w-sm text-right text-xs text-zinc-500 dark:text-zinc-400 sm:text-left"
          role="status"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
