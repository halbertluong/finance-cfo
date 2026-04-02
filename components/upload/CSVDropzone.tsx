'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseCSVFile } from '@/lib/csv/parser';
import { ParsedCSV } from '@/models/types';

interface Props {
  onParsed: (csv: ParsedCSV) => void;
}

export function CSVDropzone({ onParsed }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError(null);
      setLoading(true);
      try {
        const csv = await parseCSVFile(file);
        onParsed(csv);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      } finally {
        setLoading(false);
      }
    },
    [onParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-green-500 bg-green-50 scale-[1.02]'
            : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50 bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDragActive ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isDragActive ? (
                <FileText className="w-8 h-8 text-green-600" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {isDragActive ? "Drop it!" : 'Drop your CSV here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Parsing...' : 'or click to browse — Chase, Amex, Mint, and most bank exports'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
