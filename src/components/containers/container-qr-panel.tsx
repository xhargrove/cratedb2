'use client';

import { useCallback } from 'react';

export function ContainerQrPanel({
  scanUrl,
  pngDataUrl,
  containerName,
}: {
  scanUrl: string;
  pngDataUrl: string;
  containerName: string;
}) {
  const safeName =
    containerName.replace(/[^\w\-]+/g, '-').slice(0, 60) || 'container';

  const printLabel = useCallback(() => {
    const w = window.open('', '_blank', 'width=420,height=520');
    if (!w) return;
    w.document
      .write(`<!DOCTYPE html><html><head><title>Print — ${containerName}</title>
      <style>
        body { font-family: system-ui,sans-serif; padding: 24px; text-align: center; }
        img { max-width: 280px; height: auto; }
        p { margin: 12px 0 0; font-size: 14px; color: #444; word-break: break-all; }
      </style></head><body>
      <h1 style="font-size:18px;margin:0 0 16px;">${containerName}</h1>
      <img src="${pngDataUrl}" alt="QR code" width="280" height="280" />
      <p>${scanUrl}</p>
      <script>window.onload = function() { window.print(); };</script>
      </body></html>`);
    w.document.close();
  }, [containerName, pngDataUrl, scanUrl]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        QR code
      </h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Scanning opens this page with live contents after you sign in
        (you&apos;ll land back here). Only the link is encoded — not your
        inventory data.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from server */}
      <img
        src={pngDataUrl}
        alt={`QR code linking to ${containerName}`}
        width={280}
        height={280}
        className="mx-auto rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700"
      />
      <p className="break-all text-center text-xs text-zinc-500 dark:text-zinc-500">
        {scanUrl}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={pngDataUrl}
          download={`cratedb-${safeName}-qr.png`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Download QR
        </a>
        <button
          type="button"
          onClick={printLabel}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Print label
        </button>
      </div>
    </div>
  );
}
