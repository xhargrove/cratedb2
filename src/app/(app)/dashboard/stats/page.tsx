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
  const artworkPctLabel =
    insights.artwork.percentWithArtwork === null
      ? '—'
      : `${insights.artwork.percentWithArtwork}%`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Insights
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Summary metrics for your collection and wantlist. Counts reflect what
          is stored for your account only.
        </p>
      </div>

      {!hasRecords ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">No records yet</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200">
            Add albums to see genre and artist breakdowns. Wantlist and follow
            counts below still reflect your account.
          </p>
          <Link
            href="/dashboard/records/new"
            className="mt-3 inline-block rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add a record
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label="Records" value={insights.recordCount} />
        <SummaryCard label="Wantlist items" value={insights.wantlistCount} />
        <SummaryCard
          label="Distinct artists"
          sub="Unique artists among your records"
          value={insights.distinctArtistsInCollection}
        />
        <SummaryCard
          label="Artwork coverage"
          value={artworkPctLabel}
          sub={
            insights.recordCount === 0
              ? undefined
              : `${insights.artwork.withArtwork} of ${insights.recordCount} records have artwork`
          }
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
          View records
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <RankedInsightsBlock
          title="Genres"
          description="Top genres by record count in your collection (missing genre is grouped separately)."
          rows={hasRecords ? insights.genres : []}
          emptyHint={
            hasRecords
              ? 'No genre data to show.'
              : 'Add records to see genre breakdowns.'
          }
        />
        <RankedInsightsBlock
          title="Artists"
          description="Artists with the most records in your collection."
          rows={hasRecords ? insights.artists : []}
          emptyHint={
            hasRecords
              ? 'No artist data to show.'
              : 'Add records to see artist frequency.'
          }
        />
        <RankedInsightsBlock
          title="Release years"
          description="Most common release years among records that have a year set."
          rows={hasRecords ? insights.topReleaseYears : []}
          emptyHint={
            hasRecords
              ? 'No release years yet — add a year on your records to see this chart.'
              : 'Add records with release years to see year distribution.'
          }
        />
      </div>
    </div>
  );
}
