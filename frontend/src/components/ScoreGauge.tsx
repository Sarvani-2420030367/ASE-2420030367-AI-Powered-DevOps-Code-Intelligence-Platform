import React from 'react';

interface ScoreGaugeProps {
  score: number;
  quality: number;
  security: number;
  maintainability: number;
  architecture: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  quality,
  security,
  maintainability,
  architecture,
}) => {
  const rounded = Math.round(score || 0);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rounded / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (val >= 60) return 'text-sky-400 stroke-sky-500';
    if (val >= 40) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const scoreColor = getScoreColor(rounded);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Overall Code Health</h3>
          <p className="text-xs text-slate-500 mt-0.5">Weighted metric based on static inspection</p>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
          4-Pillar Score
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Gauge Center */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-800"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={`${scoreColor} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight">{rounded}</span>
            <span className="text-xs font-medium text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="md:col-span-7 space-y-3.5">
          <PillarBar label="Code Quality (40%)" value={quality} color="bg-indigo-500" />
          <PillarBar label="Security (30%)" value={security} color="bg-rose-500" />
          <PillarBar label="Maintainability (20%)" value={maintainability} color="bg-amber-500" />
          <PillarBar label="Architecture (10%)" value={architecture} color="bg-emerald-500" />
        </div>
      </div>
    </div>
  );
};

const PillarBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const val = Math.round(value || 0);
  return (
    <div>
      <div className="flex justify-between text-xs font-medium mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-200 font-semibold">{val}%</span>
      </div>
      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/40">
        <div
          className={`h-full ${color} transition-all duration-700 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
        />
      </div>
    </div>
  );
};
