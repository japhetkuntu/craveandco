import * as XLSX from 'xlsx';

export interface ExportColumn<T = Record<string, unknown>> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

export interface ExportSheet<T = Record<string, unknown>> {
  name: string;
  columns: ExportColumn<T>[];
  data: T[];
}

function buildRows<T>(sheet: ExportSheet<T>): (string | number | null)[][] {
  const header = sheet.columns.map((c) => c.header);
  const rows = sheet.data.map((row) =>
    sheet.columns.map((c) => {
      const val = c.value(row);
      return val === undefined ? null : val;
    }),
  );
  return [header, ...rows];
}

export function exportToCSV<T>(sheet: ExportSheet<T>, filename: string) {
  const rows = buildRows(sheet);
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          // Escape quotes and wrap in quotes if the value contains a comma, newline, or quote
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(','),
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportToXLSX(sheets: ExportSheet[], filename: string) {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const rows = buildRows(sheet);
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Style header row (bold, background colour)
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'C8973A' } }, // brand gold
        alignment: { horizontal: 'center' },
      };
    }

    // Auto column widths
    const colWidths = sheet.columns.map((col, ci) => {
      const maxLen = Math.max(
        col.header.length,
        ...sheet.data.map((row) => String(col.value(row) ?? '').length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${filename}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Stamp current date on a filename */
export function stampedName(base: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${base}-${d}`;
}
