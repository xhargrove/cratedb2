import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { containerImageUrl } from '@/lib/container-image-url';
import { buildContainerScanUrl } from '@/lib/container-url';
import { qrCodePngDataUrl } from '@/lib/container-qr';
import { resolvePublicAppOrigin } from '@/lib/public-app-url';
import { ContainerRecordAssignPanel } from '@/components/containers/container-record-assign';
import { ContainerQrPanel } from '@/components/containers/container-qr-panel';
import { DeleteContainerForm } from '@/components/containers/delete-container-form';
import {
  containerKindLabel,
  ContainerKindIcon,
} from '@/components/containers/container-kind-icon';
import { requireUser } from '@/server/auth/require-user';
import { getStorageContainerByIdForOwner } from '@/server/containers/get-by-id-for-owner';
import { listRecordsAssignableToContainer } from '@/server/containers/list-assignable-records';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Container · Cratedb`, description: id };
}

export default async function ContainerDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const container = await getStorageContainerByIdForOwner(id, user.id);
  if (!container) {
    notFound();
  }

  const origin = await resolvePublicAppOrigin();
  const scanUrl = buildContainerScanUrl(origin, container.id);
  const pngDataUrl = await qrCodePngDataUrl(scanUrl);

  const assignable = await listRecordsAssignableToContainer(user.id, container.id);

  const cover = containerImageUrl(
    container.id,
    Boolean(container.imageKey),
    container.imageUpdatedAt
  );
  const kindLabel = containerKindLabel(container.kind);
  const count = container._count.records;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/containers"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← My containers
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/containers/${container.id}/edit`}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Edit
          </Link>
          <DeleteContainerForm containerId={container.id} />
        </div>
      </div>

      <header className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover"
              width={96}
              height={96}
            />
          ) : (
            <ContainerKindIcon kind={container.kind} label={kindLabel} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
            {kindLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {container.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
              {count}
            </span>{' '}
            {count === 1 ? 'record' : 'records'}
          </p>
          {container.locationNote?.trim() ? (
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              {container.locationNote.trim()}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-zinc-500 dark:text-zinc-500">
              No location note
            </p>
          )}
        </div>
      </header>

      <ContainerQrPanel
        scanUrl={scanUrl}
        pngDataUrl={pngDataUrl}
        containerName={container.name}
      />

      <ContainerRecordAssignPanel
        containerId={container.id}
        assignable={assignable}
        inContainer={container.records}
      />
    </div>
  );
}
