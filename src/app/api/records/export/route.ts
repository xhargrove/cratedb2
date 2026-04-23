import { NextResponse } from 'next/server';

import {
  formatRecordsAsCsv,
  formatRecordsAsTsv,
} from '@/lib/export/records-format';
import { buildRecordsPdf } from '@/lib/export/records-pdf';
import { getCurrentUser } from '@/server/auth/get-current-user';
import { listRecordsForExport } from '@/server/records/list-for-export';

const ALLOWED = new Set(['csv', 'txt', 'pdf']);

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get('format')?.toLowerCase();
  if (!format || !ALLOWED.has(format)) {
    return new NextResponse(
      'Invalid or missing format. Use ?format=csv, txt, or pdf',
      { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const { rows, totalInDatabase, capped } = await listRecordsForExport(user.id);
  const exportedAt = new Date();
  const dateStamp = exportedAt.toISOString().slice(0, 10);
  const suffix = capped ? `-partial` : '';

  if (format === 'csv') {
    const body = formatRecordsAsCsv(rows);
    const filename = `cratedb-records-${dateStamp}${suffix}.csv`;
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
    const body = formatRecordsAsTsv(rows);
    const filename = `cratedb-records-${dateStamp}${suffix}.txt`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const pdfBytes = await buildRecordsPdf(rows, {
    capped,
    totalInDatabase,
    exportedAt,
  });
  const filename = `cratedb-records-${dateStamp}${suffix}.pdf`;
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
