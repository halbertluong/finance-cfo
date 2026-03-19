import Papa from 'papaparse';
import { ParsedCSV } from '@/models/types';

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        if (rows.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        const headers = Object.keys(rows[0]);
        resolve({
          headers,
          rows,
          sampleRows: rows.slice(0, 5),
        });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export function parseCSVText(text: string): ParsedCSV {
  const results = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const rows = results.data;
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows, sampleRows: rows.slice(0, 5) };
}
