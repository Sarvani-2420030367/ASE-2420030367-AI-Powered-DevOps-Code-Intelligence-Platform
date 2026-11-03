import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const s = severity?.toUpperCase() || 'INFO';

  const styles: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-yellow-500/10',
    LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-sky-500/10',
    INFO: 'bg-slate-500/10 text-slate-400 border-slate-500/30 shadow-slate-500/10',
  };

  const styleClass = styles[s] || styles.INFO;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${padding} ${styleClass} code-font tracking-wide`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s === 'CRITICAL' ? 'bg-red-400 animate-pulse' : s === 'HIGH' ? 'bg-amber-400' : s === 'MEDIUM' ? 'bg-yellow-400' : 'bg-sky-400'}`} />
      {s}
    </span>
  );
};
