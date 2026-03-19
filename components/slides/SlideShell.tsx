import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export function SlideShell({ children, className = '', gradient }: Props) {
  return (
    <div
      className={`w-full h-full flex flex-col relative overflow-hidden bg-[#0a0a0f] ${className}`}
      style={gradient ? { background: gradient } : undefined}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col h-full p-8 lg:p-12">
        {children}
      </div>
    </div>
  );
}

export function SlideLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] text-violet-400/80 font-medium mb-2">
      {children}
    </p>
  );
}

export function SlideTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-3xl lg:text-4xl font-bold text-white leading-tight ${className}`}>
      {children}
    </h2>
  );
}

export function KPICard({
  label,
  value,
  sub,
  color = 'violet',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'violet' | 'green' | 'red' | 'blue' | 'amber';
}) {
  const colors = {
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  };
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br border ${colors[color]}`}>
      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}
