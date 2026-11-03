import React, { useState } from 'react';
import { Finding, Project } from '../types';
import { FindingCard } from '../components/FindingCard';
import { Activity, Filter, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CodeQualityProps {
  findings: Finding[];
  project: Project | null;
  onExplainInAI: (finding: Finding) => void;
  onOpenFile: (file: string, line: number) => void;
}

export const CodeQuality: React.FC<CodeQualityProps> = ({
  findings,
  project,
  onExplainInAI,
  onOpenFile,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Filter for non-SECURITY findings (QUALITY, MAINTAINABILITY, ARCHITECTURE)
  const qualityFindings = findings.filter((f) => f.type !== 'SECURITY');

  const filtered = qualityFindings.filter((f) => {
    if (severityFilter === 'ALL') return true;
    return f.severity === severityFilter;
  });

  const counts = {
    CRITICAL: qualityFindings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH: qualityFindings.filter((f) => f.severity === 'HIGH').length,
    MEDIUM: qualityFindings.filter((f) => f.severity === 'MEDIUM').length,
    LOW: qualityFindings.filter((f) => f.severity === 'LOW').length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Code Quality & Maintainability</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                AST inspections, complexity bottlenecks, error-handling smells, and clean-code compliance
              </p>
            </div>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => {
            const count = sev === 'ALL' ? qualityFindings.length : (counts as any)[sev];
            const isSelected = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {sev} <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Code Quality Issues Flagged</h3>
          <p className="text-xs text-slate-400 mt-1">
            {severityFilter !== 'ALL'
              ? `No findings match the '${severityFilter}' severity filter.`
              : 'All static quality rules passed cleanly!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onExplainInAI={onExplainInAI}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};
