import * as XLSX from 'xlsx';

interface ExportHeader {
  key: string;
  title: string;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers: ExportHeader[],
): void {
  const exportData = data.map((row) => {
    const formattedRow: Record<string, unknown> = {};
    headers.forEach((header) => {
      formattedRow[header.title] = row[header.key] ?? '';
    });
    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const colWidths = headers.map((header) => ({
    wch: Math.max(header.title.length * 2, 12),
  }));
  worksheet['!cols'] = colWidths;

  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalFilename);
}
