import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { SingleExportRow } from '@/types/single-export';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const FONT_SIZE = 9;
const LINE_H = 11;
const TITLE_SIZE = 14;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Simple multi-page PDF listing singles (ASCII-oriented; suitable for vinyl metadata).
 */
export async function buildSinglesPdf(
  rows: SingleExportRow[],
  meta: { capped: boolean; totalInDatabase: number; exportedAt: Date }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const title = 'Cratedb — Singles (45s)';
  page.drawText(title, {
    x: MARGIN,
    y,
    size: TITLE_SIZE,
    font: bold,
    color: rgb(0.12, 0.12, 0.14),
  });
  y -= LINE_H * 2;

  const subtitle = `Exported ${meta.exportedAt.toISOString().slice(0, 10)} · ${rows.length} row(s)`;
  page.drawText(truncate(subtitle, 120), {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font,
    color: rgb(0.35, 0.35, 0.38),
  });
  y -= LINE_H * 1.5;

  if (meta.capped) {
    page.drawText(
      truncate(
        `Note: Only the first ${rows.length.toLocaleString()} of ${meta.totalInDatabase.toLocaleString()} singles are included (export limit).`,
        95
      ),
      {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.65, 0.35, 0.12),
      }
    );
    y -= LINE_H * 2;
  } else {
    y -= LINE_H * 0.5;
  }

  const columnHint =
    'Artist · Title · Year · Genre · Storage — notes if any (truncated for PDF layout)';
  page.drawText(truncate(columnHint, 92), {
    x: MARGIN,
    y,
    size: FONT_SIZE - 0.5,
    font: bold,
    color: rgb(0.2, 0.2, 0.22),
  });
  y -= LINE_H * 2;

  for (const r of rows) {
    const parts = [
      r.artist,
      r.title,
      r.bSideTitle ? `B:${r.bSideTitle}` : '',
      r.year != null ? String(r.year) : '',
      r.genre ?? '',
      r.storageLocation ?? '',
      r.quantity > 1 ? `×${r.quantity}` : '',
    ].filter(Boolean);
    let line = parts.join(' · ');
    if (r.notes?.trim()) {
      line += ` — ${r.notes.trim()}`;
    }
    line = truncate(line.replace(/\s+/g, ' ').trim(), 92);

    if (y < MARGIN + LINE_H * 3) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }

    page.drawText(line || '(empty)', {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font,
      color: rgb(0.15, 0.15, 0.18),
    });
    y -= LINE_H * 1.2;
  }

  return doc.save();
}
