import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buildContainerScanUrl } from '@/lib/container-url';
import { qrCodePngDataUrl } from '@/lib/container-qr';
import { resolvePublicAppOrigin } from '@/lib/public-app-url';
import { recordArtworkUrl } from '@/lib/record-artwork-url';
import { singleArtworkUrl } from '@/lib/single-artwork-url';
import { twelveInchArtworkUrl } from '@/lib/twelve-inch-artwork-url';
import { ContainerQrPanel } from '@/components/containers/container-qr-panel';
import {
  containerKindLabel,
  ContainerKindIcon,
} from '@/components/containers/container-kind-icon';
import { requireUser } from '@/server/auth/require-user';
import { listRecordsForPhysicalSlot } from '@/server/records/physical-slots';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Container · Cratedb`, description: id.slice(0, 32) };
}

function capNote(
  label: string,
  total: number,
  shown: number,
  capped: boolean
): string | null {
  if (!capped) return null;
  return `${label}: showing first ${shown} of ${total.toLocaleString()} (list cap)`;
}

function decodeSlotKeySegment(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function ContainerDetailPage({ params }: Props) {
  const { id: rawId } = await params;
  const slotKey = decodeSlotKeySegment(rawId);
  const user = await requireUser();

  const result = await listRecordsForPhysicalSlot(user.id, slotKey);
  if (!result) {
    notFound();
  }

  const origin = await resolvePublicAppOrigin();
  const scanUrl = buildContainerScanUrl(origin, result.slotKey);
  const pngDataUrl = await qrCodePngDataUrl(scanUrl);

  const kindLabel = containerKindLabel(result.slot.storageKind);
  const count = result.total;

  const capParts = [
    capNote('Albums', result.recordTotal, result.records.length, result.recordsCapped),
    capNote('45s', result.singleTotal, result.singles.length, result.singlesCapped),
    capNote(
      '12-inch',
      result.twelveInchTotal,
      result.twelveInch.length,
      result.twelveInchCapped
    ),
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/containers"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← My containers
        </Link>
      </div>

      <header className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <ContainerKindIcon kind={result.slot.storageKind} label={kindLabel} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
            {kindLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {result.label}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
              {count}
            </span>{' '}
            {count === 1 ? 'release' : 'releases'}{' '}
            <span className="text-zinc-500 dark:text-zinc-500">
              (
              {[
                result.recordTotal > 0
                  ? `${result.recordTotal} album${result.recordTotal === 1 ? '' : 's'}`
                  : null,
                result.singleTotal > 0
                  ? `${result.singleTotal} 45${result.singleTotal === 1 ? '' : 's'}`
                  : null,
                result.twelveInchTotal > 0
                  ? `${result.twelveInchTotal} 12-inch`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              )
            </span>
          </p>
          {capParts.length > 0 ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              {capParts.join(' · ')}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            To move releases in or out, edit storage on each album, 45, or
            12-inch entry.
          </p>
        </div>
      </header>

      <ContainerQrPanel
        scanUrl={scanUrl}
        pngDataUrl={pngDataUrl}
        containerName={result.label}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Albums here
        </h2>
        {result.records.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No albums in this slot.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {result.records.map((rec) => {
              const art = recordArtworkUrl(
                rec.id,
                Boolean(rec.artworkKey),
                rec.artworkUpdatedAt
              );
              return (
                <li
                  key={rec.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={art}
                        alt=""
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">No art</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/records/${rec.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {rec.artist} — {rec.title}
                    </Link>
                    {rec.year != null ? (
                      <span className="ml-2 text-xs text-zinc-500">({rec.year})</span>
                    ) : null}
                    {rec.quantity > 1 ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        ×{rec.quantity}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          45s (singles) here
        </h2>
        {result.singles.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No 45s in this slot.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {result.singles.map((s) => {
              const art = singleArtworkUrl(
                s.id,
                Boolean(s.artworkKey),
                s.artworkUpdatedAt
              );
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={art}
                        alt=""
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">No art</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/singles/${s.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {s.artist} — {s.title}
                    </Link>
                    {s.bSideTitle ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        B: {s.bSideTitle}
                      </span>
                    ) : null}
                    {s.year != null ? (
                      <span className="ml-2 text-xs text-zinc-500">({s.year})</span>
                    ) : null}
                    {s.quantity > 1 ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        ×{s.quantity}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          12-inch singles here
        </h2>
        {result.twelveInch.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No 12-inch singles in this slot.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {result.twelveInch.map((t) => {
              const art = twelveInchArtworkUrl(
                t.id,
                Boolean(t.artworkKey),
                t.artworkUpdatedAt
              );
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={art}
                        alt=""
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">No art</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/twelve-inch/${t.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {t.artist} — {t.title}
                    </Link>
                    {t.bSideTitle ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        B: {t.bSideTitle}
                      </span>
                    ) : null}
                    {t.year != null ? (
                      <span className="ml-2 text-xs text-zinc-500">({t.year})</span>
                    ) : null}
                    {t.quantity > 1 ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        ×{t.quantity}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
