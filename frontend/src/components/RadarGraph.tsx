import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface RadarGraphProps {
  data: Record<string, number>;
  overallScore: number;
}

export const RadarGraph: React.FC<RadarGraphProps> = ({ data, overallScore }) => {
  const chartData = Object.entries(data || {}).map(([pillar, score]) => ({
    subject: pillar,
    score: Math.round(score),
    fullMark: 100,
  }));

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">DevOps Readiness</h3>
          <p className="text-xs text-slate-500 mt-0.5">8-Pillar delivery maturity radar</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-sky-400 code-font">{Math.round(overallScore || 0)}%</span>
          <p className="text-[10px] text-slate-400">Readiness Index</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc'
              }}
            />
            <Radar
              name="DevOps Readiness"
              dataKey="score"
              stroke="#38bdf8"
              fill="#38bdf8"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center">
        {chartData.slice(0, 4).map((item) => (
          <div key={item.subject} className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-800">
            <span className="block text-[10px] text-slate-400 truncate">{item.subject}</span>
            <span className="text-xs font-semibold text-white code-font">{item.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
