import React, { useState } from 'react';
import { Finding } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { ChevronDown, ChevronUp, Sparkles, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  onExplainInAI?: (finding: Finding) => void;
  onOpenFile?: (filePath: string, line: number) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onExplainInAI, onOpenFile }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <SeverityBadge severity={finding.severity} size="sm" />
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
              {finding.type}
            </span>
            <button
              onClick={() => onOpenFile?.(finding.file_path, finding.line_number)}
              className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              {finding.file_path}:{finding.line_number}
            </button>
          </div>

          <h4 className="text-sm font-semibold text-white mt-2 tracking-tight">{finding.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{finding.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {onExplainInAI && (
            <button
              onClick={() => onExplainInAI(finding)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 text-xs font-medium transition-colors"
              title="Explain Issue with AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Explain
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Why it matters
            </div>
            <p className="text-xs text-slate-300 pl-5 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
              {finding.description}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Suggested Fix
            </div>
            <p className="text-xs text-slate-300 pl-5 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 font-mono">
              {finding.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
