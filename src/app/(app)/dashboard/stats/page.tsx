import type { Metadata } from 'next';
import Link from 'next/link';

import { RankedInsightsBlock } from '@/app/(app)/dashboard/stats/ranked-block';
import { requireUser } from '@/server/auth/require-user';
import { getOwnerInsights } from '@/server/stats/get-owner-insights';

export const metadata: Metadata = {
  title: 'Insights · Cratedb',
};

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      ) : null}
    </div>
  );
}

export default async function DashboardStatsPage() {
  const user = await requireUser();
  const insights = await getOwnerInsights(user.id);

  const hasRecords = insights.recordCount > 0;
  const hasSingles = insights.singleCount > 0;
  const hasTwelveInch = insights.twelveInchCount > 0;
  const hasAnyCollection = hasRecords || hasSingles || hasTwelveInch;

  const albumArtworkPctLabel =
    insights.artwork.percentWithArtwork === null
      ? '—'
      : `${insights.artwork.percentWithArtwork}%`;

  const singlesArtworkPctLabel =
    insights.singlesArtwork.percentWithArtwork === null
      ? '—'
      : `${insights.singlesArtwork.percentWithArtwork}%`;

  const twelveInchArtworkPctLabel =
    insights.twelveInchArtwork.percentWithArtwork === null
      ? '—'
      : `${insights.twelveInchArtwork.percentWithArtwork}%`;

  const singlesCopiesSub =
    insights.singleCount === 0
      ? undefined
      : insights.singlesTotalCopies !== insights.singleCount
        ? `${insights.singlesTotalCopies.toLocaleString()} owned discs across ${insights.singleCount.toLocaleString()} listings`
        : `${insights.singlesTotalCopies.toLocaleString()} owned disc${insights.singlesTotalCopies === 1 ? '' : 's'}`;

  const twelveInchCopiesSub =
    insights.twelveInchCount === 0
      ? undefined
      : insights.twelveInchTotalCopies !== insights.twelveInchCount
        ? `${insights.twelveInchTotalCopies.toLocaleString()} owned discs across ${insights.twelveInchCount.toLocaleString()} listings`
        : `${insights.twelveInchTotalCopies.toLocaleString()} owned disc${insights.twelveInchTotalCopies === 1 ? '' : 's'}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Insights
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Summary metrics for your albums, singles, 12-inch releases, and
          wantlist. Counts reflect what is stored for your account only.
        </p>
      </div>

      {!hasAnyCollection ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">No collection items yet</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200">
            Add albums, 45s, or 12-inch singles to see breakdowns. Wantlist and
            follow counts below still reflect your account.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/records/new"
              className="inline-block rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add a record
            </Link>
            <Link
              href="/dashboard/singles/new"
              className="inline-block rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Add a 45
            </Link>
            <Link
              href="/dashboard/twelve-inch/new"
              className="inline-block rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Add a 12-inch
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Album records" value={insights.recordCount} />
        <SummaryCard
          label="Singles (45s, listings)"
          value={insights.singleCount}
          sub={singlesCopiesSub}
        />
        <SummaryCard
          label="12-inch (listings)"
          value={insights.twelveInchCount}
          sub={twelveInchCopiesSub}
        />
        <SummaryCard label="Wantlist items" value={insights.wantlistCount} />
        <SummaryCard
          label="Album artwork"
          value={albumArtworkPctLabel}
          sub={
            insights.recordCount === 0
              ? undefined
              : `${insights.artwork.withArtwork} of ${insights.recordCount} albums have artwork`
          }
        />
        <SummaryCard
          label="45s artwork"
          value={singlesArtworkPctLabel}
          sub={
            insights.singleCount === 0
              ? undefined
              : `${insights.singlesArtwork.withArtwork} of ${insights.singleCount} singles have sleeve art`
          }
        />
        <SummaryCard
          label="12-inch artwork"
          value={twelveInchArtworkPctLabel}
          sub={
            insights.twelveInchCount === 0
              ? undefined
              : `${insights.twelveInchArtwork.withArtwork} of ${insights.twelveInchCount} have sleeve art`
          }
        />
        <SummaryCard
          label="Distinct artists (albums)"
          sub="Unique artists among album rows"
          value={insights.distinctArtistsInCollection}
        />
        <SummaryCard
          label="Distinct artists (45s)"
          sub="Unique artists among 45 rows"
          value={insights.distinctArtistsInSingles}
        />
        <SummaryCard
          label="Distinct artists (12-inch)"
          sub="Unique artists among 12-inch rows"
          value={insights.distinctArtistsInTwelveInch}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Followers"
          value={insights.follows.followers}
          sub="Users following your public profile"
        />
        <SummaryCard
          label="Following"
          value={insights.follows.following}
          sub="Profiles you follow"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          ← Dashboard
        </Link>
        <Link
          href="/dashboard/records"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          View albums
        </Link>
        <Link
          href="/dashboard/singles"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          View 45s
        </Link>
        <Link
          href="/dashboard/twelve-inch"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          View 12-inch
        </Link>
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Albums &amp; LPs
        </h2>
        <div className="grid gap-6 lg:grid-cols-1">
          <RankedInsightsBlock
            title="Genres"
            description="Top genres by album count in your collection (missing genre is grouped separately)."
            rows={hasRecords ? insights.genres : []}
            emptyHint={
              hasRecords
                ? 'No genre data to show.'
                : 'Add albums to see genre breakdowns.'
            }
          />
          <RankedInsightsBlock
            title="Artists"
            description="Artists with the most albums in your collection."
            rows={hasRecords ? insights.artists : []}
            emptyHint={
              hasRecords
                ? 'No artist data to show.'
                : 'Add albums to see artist frequency.'
            }
          />
          <RankedInsightsBlock
            title="Release years"
            description="Most common release years among albums that have a year set."
            rows={hasRecords ? insights.topReleaseYears : []}
            emptyHint={
              hasRecords
                ? 'No release years yet — add a year on your albums to see this chart.'
                : 'Add albums with release years to see year distribution.'
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Singles (45s)
        </h2>
        <div className="grid gap-6 lg:grid-cols-1">
          <RankedInsightsBlock
            title="Genres"
            description="Top genres by 45 listing count (missing genre is grouped separately)."
            rows={hasSingles ? insights.singlesGenres : []}
            emptyHint={
              hasSingles
                ? 'No genre data to show.'
                : 'Add 45s to see genre breakdowns.'
            }
          />
          <RankedInsightsBlock
            title="Artists"
            description="Artists with the most 45 listings in your crate."
            rows={hasSingles ? insights.singlesArtists : []}
            emptyHint={
              hasSingles
                ? 'No artist data to show.'
                : 'Add 45s to see artist frequency.'
            }
          />
          <RankedInsightsBlock
            title="Release years"
            description="Most common release years among 45s that have a year set."
            rows={hasSingles ? insights.singlesTopReleaseYears : []}
            emptyHint={
              hasSingles
                ? 'No release years yet — add a year on your singles to see this chart.'
                : 'Add 45s with release years to see year distribution.'
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          12-inch singles
        </h2>
        <div className="grid gap-6 lg:grid-cols-1">
          <RankedInsightsBlock
            title="Genres"
            description="Top genres by 12-inch listing count (missing genre is grouped separately)."
            rows={hasTwelveInch ? insights.twelveInchGenres : []}
            emptyHint={
              hasTwelveInch
                ? 'No genre data to show.'
                : 'Add 12-inch singles to see genre breakdowns.'
            }
          />
          <RankedInsightsBlock
            title="Artists"
            description="Artists with the most 12-inch listings in your crate."
            rows={hasTwelveInch ? insights.twelveInchArtists : []}
            emptyHint={
              hasTwelveInch
                ? 'No artist data to show.'
                : 'Add 12-inch singles to see artist frequency.'
            }
          />
          <RankedInsightsBlock
            title="Release years"
            description="Most common release years among 12-inch singles that have a year set."
            rows={hasTwelveInch ? insights.twelveInchTopReleaseYears : []}
            emptyHint={
              hasTwelveInch
                ? 'No release years yet — add a year to see this chart.'
                : 'Add 12-inch singles with release years to see year distribution.'
            }
          />
        </div>
      </section>
    </div>
  );
}
