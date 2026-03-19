interface Props {
  percent: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ percent, showLabel, size = 'md' }: Props) {
  const clamped = Math.min(Math.max(percent, 0), 150);
  const color =
    clamped >= 100 ? 'bg-red-500' : clamped >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  const h = size === 'sm' ? 'h-1' : 'h-2';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-white/10 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(clamped, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium tabular-nums ${clamped >= 100 ? 'text-red-400' : 'text-white/50'}`}>
          {percent.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
