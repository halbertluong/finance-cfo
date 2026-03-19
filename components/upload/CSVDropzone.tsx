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
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
            : 'border-white/20 hover:border-violet-400/60 hover:bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              {isDragActive ? (
                <FileText className="w-8 h-8 text-violet-400" />
              ) : (
                <Upload className="w-8 h-8 text-violet-400" />
              )}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-white">
              {isDragActive ? 'Drop it like it\'s hot' : 'Drop your CSV here'}
            </p>
            <p className="text-sm text-white/50 mt-1">
              {loading ? 'Parsing...' : 'or click to browse — supports Chase, Amex, Mint, and most bank exports'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
