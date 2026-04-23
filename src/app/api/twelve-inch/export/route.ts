import { NextResponse } from 'next/server';

import {
  formatSinglesAsCsv,
  formatSinglesAsTsv,
} from '@/lib/export/singles-format';
import { buildTwelveInchPdf } from '@/lib/export/twelve-inch-pdf';
import { resolveAuth } from '@/server/auth/get-current-user';
import { listTwelveInchForExport } from '@/server/twelve-inch-singles/list-for-export';

const ALLOWED = new Set(['csv', 'txt', 'pdf']);

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get('format')?.toLowerCase();
  if (!format || !ALLOWED.has(format)) {
    return new NextResponse(
      'Invalid or missing format. Use ?format=csv, txt, or pdf',
      { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const auth = await resolveAuth();
  if (auth.status === 'backend_unavailable') {
    return new NextResponse('Service unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  if (auth.status !== 'authenticated') {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const user = auth.user;

  const { rows, totalInDatabase, capped } = await listTwelveInchForExport(
    user.id
  );
  const exportedAt = new Date();
  const dateStamp = exportedAt.toISOString().slice(0, 10);
  const suffix = capped ? `-partial` : '';

  if (format === 'csv') {
    const body = formatSinglesAsCsv(rows);
    const filename = `cratedb-twelve-inch-${dateStamp}${suffix}.csv`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }

  if (format === 'txt') {
    const body = formatSinglesAsTsv(rows);
    const filename = `cratedb-twelve-inch-${dateStamp}${suffix}.txt`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const pdfBytes = await buildTwelveInchPdf(rows, {
    capped,
    totalInDatabase,
    exportedAt,
  });
  const filename = `cratedb-twelve-inch-${dateStamp}${suffix}.pdf`;
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
