'use client';

import { CashFlowCalendarDay } from '@/models/types';
import { CheckCircle } from 'lucide-react';

interface Props {
  days: CashFlowCalendarDay[];
  monthKey: string; // 'YYYY-MM'
}

const fmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CashFlowCalendar({ days, monthKey }: Props) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const totalDays = days.length;

  // Build grid cells: empty padding cells + day cells
  const cells: (CashFlowCalendarDay | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...days,
  ];

  // Pad to full week rows
  while (cells.length % 7 !== 0) cells.push(null);

  const maxBalance = Math.max(...days.map((d) => Math.abs(d.runningBalance)), 1);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{SHORT_MONTHS[month - 1]} {year} — Cash Flow</h3>
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Inflow
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Outflow
          </span>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 bg-white">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-100 bg-gray-50" />;
          }

          const isToday = (() => {
            const now = new Date();
            return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === cell.day;
          })();

          const balanceBarHeight = Math.round((Math.abs(cell.runningBalance) / maxBalance) * 28);
          const balanceColor = cell.runningBalance >= 0 ? 'bg-green-200' : 'bg-red-200';

          return (
            <div
              key={cell.day}
              className={`min-h-[100px] border-r border-b border-gray-100 p-1.5 flex flex-col ${
                cell.isWeekend ? 'bg-gray-50' : 'bg-white'
              } ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}
            >
              {/* Day number */}
              <span className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                {cell.day}
              </span>

              {/* Events */}
              <div className="flex-1 space-y-0.5">
                {cell.events.map((ev, j) => (
                  <div
                    key={j}
                    className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-tight ${
                      ev.amount > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ev.isActual && (
                      <CheckCircle className="w-2.5 h-2.5 shrink-0 text-green-600" />
                    )}
                    <span className="truncate font-medium">{ev.label}</span>
                    <span className="ml-auto shrink-0 font-semibold">
                      {ev.amount > 0 ? '+' : ''}{fmt(ev.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Running balance bar + amount */}
              <div className="mt-1 pt-1 border-t border-gray-100">
                <div className="flex items-end gap-1">
                  <div
                    className={`w-1 rounded-sm ${balanceColor}`}
                    style={{ height: `${Math.max(balanceBarHeight, 4)}px` }}
                  />
                  <span className={`text-[10px] font-medium tabular-nums ${
                    cell.runningBalance >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {fmt(cell.runningBalance)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly summary footer */}
      {days.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex gap-4 text-xs text-gray-600">
            <span>
              Total inflows:{' '}
              <strong className="text-green-700">
                {fmt(days.flatMap((d) => d.events).filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0))}
              </strong>
            </span>
            <span>
              Total outflows:{' '}
              <strong className="text-red-600">
                {fmt(Math.abs(days.flatMap((d) => d.events).filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0)))}
              </strong>
            </span>
          </div>
          <span className={`text-xs font-semibold ${days[totalDays - 1]?.runningBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            Month-end balance: {fmt(days[totalDays - 1]?.runningBalance ?? 0)}
          </span>
        </div>
      )}
    </div>
  );
}
