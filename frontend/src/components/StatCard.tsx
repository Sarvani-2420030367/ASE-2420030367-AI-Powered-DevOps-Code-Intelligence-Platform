import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue'
}) => {
  const accentStyles = {
    blue: 'border-sky-500/20 text-sky-400 bg-sky-500/10 group-hover:border-sky-500/40',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-500/10 group-hover:border-purple-500/40',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 group-hover:border-emerald-500/40',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10 group-hover:border-amber-500/40',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10 group-hover:border-rose-500/40',
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 tracking-tight code-font">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${accentStyles[accent]} transition-colors`}>
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/20 to-transparent group-hover:via-sky-500/30 transition-all" />
    </div>
  );
};
