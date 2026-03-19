'use client';

import { useState, useEffect } from 'react';
import { ColumnMapping, ParsedCSV } from '@/models/types';
import { detectColumnMapping } from '@/lib/csv/normalizer';
import { ChevronDown } from 'lucide-react';

interface Props {
  csv: ParsedCSV;
  onMappingConfirmed: (mapping: ColumnMapping) => void;
}

const REQUIRED_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'description', label: 'Description / Merchant', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'type', label: 'Transaction Type (optional)', required: false },
  { key: 'category', label: 'Category (optional)', required: false },
  { key: 'account', label: 'Account Name (optional)', required: false },
];

export function ColumnMapper({ csv, onMappingConfirmed }: Props) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});

  useEffect(() => {
    const detected = detectColumnMapping(csv.headers);
    setMapping(detected);
  }, [csv.headers]);

  const isValid = mapping.date && mapping.description && mapping.amount;

  const handleSubmit = () => {
    if (!isValid) return;
    onMappingConfirmed(mapping as ColumnMapping);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Map Your Columns</h3>
        <p className="text-sm text-white/50 mt-1">
          We detected {csv.rows.length} transactions. Tell us which columns are which.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_FIELDS.map(({ key, label, required }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              {label}
              {required && <span className="text-violet-400 ml-1">*</span>}
            </label>
            <div className="relative">
              <select
                value={mapping[key] ?? ''}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, [key]: e.target.value || undefined }))
                }
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 pr-8"
              >
                <option value="">— skip —</option>
                {csv.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      {/* Sample preview */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Sample rows</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="text-xs text-white/60 w-full">
            <thead>
              <tr className="bg-white/5">
                {csv.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-white/40 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csv.sampleRows.map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  {csv.headers.map((h) => (
                    <td key={h} className="px-3 py-2 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
      >
        Analyze {csv.rows.length} Transactions →
      </button>
    </div>
  );
}
