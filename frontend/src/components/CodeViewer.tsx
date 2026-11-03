import React, { useState } from 'react';
import { SeverityBadge } from './SeverityBadge';
import { Sparkles, AlertCircle, Copy, Check } from 'lucide-react';

interface FindingMeta {
  id: string;
  line: number;
  severity: string;
  type: string;
  title: string;
  description: string;
  recommendation: string;
}

interface CodeViewerProps {
  fileName: string;
  content: string;
  findings: FindingMeta[];
  onExplainIssue?: (finding: FindingMeta) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  fileName,
  content,
  findings,
  onExplainIssue,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeFinding, setActiveFinding] = useState<FindingMeta | null>(null);

  const lines = content.split('\n');

  // Map of line_number -> finding
  const findingsMap = new Map<number, FindingMeta>();
  findings.forEach((f) => {
    if (f.line) findingsMap.set(f.line, f);
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Code Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-300 font-semibold">{fileName}</span>
          <span className="text-[11px] font-mono text-slate-400">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-2">
          {findings.length > 0 && (
            <span className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {findings.length} issue{findings.length > 1 ? 's' : ''} flagged
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="flex-1 overflow-auto code-font text-xs leading-relaxed p-2 relative max-h-[600px]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineText, idx) => {
              const lineNo = idx + 1;
              const lineFinding = findingsMap.get(lineNo);
              const isFlagged = Boolean(lineFinding);

              return (
                <React.Fragment key={lineNo}>
                  <tr
                    className={`transition-colors group ${
                      isFlagged ? 'bg-rose-500/10 hover:bg-rose-500/15' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Line number */}
                    <td className="w-12 text-right pr-4 text-slate-400 select-none py-0.5 border-r border-slate-800/80 font-mono">
                      {lineNo}
                    </td>

                    {/* Indicator Gutter */}
                    <td className="w-8 text-center py-0.5">
                      {isFlagged && (
                        <button
                          onClick={() => setActiveFinding(activeFinding?.id === lineFinding?.id ? null : lineFinding!)}
                          className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 inline-flex items-center justify-center font-bold text-[10px]"
                          title="Click to view finding"
                        >
                          !
                        </button>
                      )}
                    </td>

                    {/* Code Text */}
                    <td className="pl-3 py-0.5 text-slate-200 whitespace-pre font-mono overflow-x-auto">
                      {lineText || ' '}
                    </td>
                  </tr>

                  {/* Inline Issue Card Beside Relevant Code */}
                  {isFlagged && (
                    <tr className="bg-rose-950/20 border-y border-rose-900/40">
                      <td colSpan={3} className="p-3 pl-16">
                        <div className="flex items-start justify-between bg-slate-900/90 border border-rose-500/30 rounded-lg p-3 shadow-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={lineFinding!.severity} size="sm" />
                              <span className="text-xs font-semibold text-rose-300">{lineFinding!.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Line {lineNo}</span>
                            </div>
                            <p className="text-xs text-slate-300">{lineFinding!.description}</p>
                            <p className="text-xs text-emerald-400 font-mono mt-1">
                              Fix: {lineFinding!.recommendation}
                            </p>
                          </div>

                          {onExplainIssue && (
                            <button
                              onClick={() => onExplainIssue(lineFinding!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 text-xs font-semibold shrink-0 transition-colors shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Explain Issue
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
