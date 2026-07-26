/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuickRange, WorkEntry, WorkType } from '../types';

export interface ClientReportEntry {
  title: string;
  completedOn: string;
  workTypeName: string;
  notes?: string;
  /** Manually added in the export form (not from saved logs). */
  isExtra?: boolean;
}

export interface ClientReportOptions {
  clientName: string;
  rangeLabel: string;
  entries: ClientReportEntry[];
  includeNotes?: boolean;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileStamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'client';
}

export function getReportRangeLabel(options: {
  showCustomDates: boolean;
  customFromDate: string;
  customToDate: string;
  selectedQuickRange: QuickRange;
  entries: WorkEntry[];
}): string {
  const { showCustomDates, customFromDate, customToDate, selectedQuickRange, entries } = options;

  if (showCustomDates) {
    if (customFromDate && customToDate) {
      return `${formatDisplayDate(customFromDate)} – ${formatDisplayDate(customToDate)}`;
    }
    if (customFromDate) return `From ${formatDisplayDate(customFromDate)}`;
    if (customToDate) return `Until ${formatDisplayDate(customToDate)}`;
    return 'Custom range';
  }

  switch (selectedQuickRange) {
    case 'this-week':
      return 'This week';
    case 'this-month':
      return 'This month';
    case 'last-3-months':
      return 'Last 3 months';
    case 'this-year':
      return 'This year';
    case 'all':
    default: {
      if (entries.length === 0) return 'All time';
      const sorted = [...entries].sort(
        (a, b) => new Date(a.completedOn).getTime() - new Date(b.completedOn).getTime()
      );
      const first = sorted[0]?.completedOn;
      const last = sorted[sorted.length - 1]?.completedOn;
      if (first && last && first !== last) {
        return `All time (${formatDisplayDate(first)} – ${formatDisplayDate(last)})`;
      }
      if (first) return `All time (${formatDisplayDate(first)})`;
      return 'All time';
    }
  }
}

export function buildClientReportEntries(
  entries: WorkEntry[],
  workTypeMap: Map<string, WorkType>
): ClientReportEntry[] {
  return [...entries]
    .sort((a, b) => new Date(a.completedOn).getTime() - new Date(b.completedOn).getTime())
    .map((entry) => ({
      title: entry.title,
      completedOn: entry.completedOn,
      workTypeName: workTypeMap.get(entry.workTypeId)?.name || 'Untitled type',
      notes: entry.notes?.trim() || undefined,
    }));
}

/** Downloads a client-ready PDF work report. */
export function exportClientWorkReport(options: ClientReportOptions): void {
  const includeNotes = options.includeNotes !== false;
  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 16;

  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ORBIT  ·  WORK REPORT', marginX, 18);

  doc.setTextColor(20, 36, 39);
  doc.setFontSize(20);
  doc.text(options.clientName, marginX, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 36, 39);
  doc.text(options.rangeLabel, pageWidth - marginX, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(91, 111, 116);
  doc.text(
    `${options.entries.length} completed ${options.entries.length === 1 ? 'item' : 'items'}`,
    pageWidth - marginX,
    25,
    { align: 'right' }
  );

  doc.setDrawColor(20, 36, 39);
  doc.setLineWidth(0.6);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  const head = includeNotes
    ? [['#', 'Date', 'Work', 'Type', 'Notes']]
    : [['#', 'Date', 'Work', 'Type']];

  const body =
    options.entries.length === 0
      ? [[includeNotes ? '—' : '—', '—', 'No completed work in this range.', '—', ...(includeNotes ? ['—'] : [])]]
      : options.entries.map((entry, index) => {
          const row = [
            String(index + 1),
            formatDisplayDate(entry.completedOn),
            entry.isExtra ? `${entry.title}  · added` : entry.title,
            entry.workTypeName,
          ];
          if (includeNotes) {
            row.push(entry.notes || '—');
          }
          return row;
        });

  autoTable(doc, {
    startY: 42,
    head,
    body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: [20, 36, 39],
      lineColor: [215, 224, 227],
      lineWidth: 0.2,
      valign: 'top',
    },
    headStyles: {
      fillColor: [244, 247, 248],
      textColor: [91, 111, 116],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: includeNotes
      ? {
          0: { cellWidth: 10 },
          1: { cellWidth: 28 },
          2: { cellWidth: 50 },
          3: { cellWidth: 28 },
          4: { cellWidth: 'auto' },
        }
      : {
          0: { cellWidth: 12 },
          1: { cellWidth: 32 },
          2: { cellWidth: 80 },
          3: { cellWidth: 'auto' },
        },
    didParseCell: (data) => {
      if (data.section !== 'body') return;

      const entry = options.entries[data.row.index];
      const isExtra = !!entry?.isExtra;

      if (data.column.index === 2) {
        data.cell.styles.fontStyle = isExtra ? 'bolditalic' : 'bold';
      }

      if (isExtra) {
        data.cell.styles.fillColor = [236, 247, 245];
        if (data.column.index !== 2) {
          data.cell.styles.fontStyle = 'italic';
        }
      }
    },
    margin: { left: marginX, right: marginX },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

  doc.setDrawColor(215, 224, 227);
  doc.setLineWidth(0.3);
  doc.line(marginX, finalY + 10, pageWidth - marginX, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(91, 111, 116);
  doc.text(`Generated ${generatedOn}`, pageWidth / 2, finalY + 16, { align: 'center' });

  const filename = `work-report-${slugify(options.clientName)}-${formatFileStamp()}.pdf`;
  doc.save(filename);
}
