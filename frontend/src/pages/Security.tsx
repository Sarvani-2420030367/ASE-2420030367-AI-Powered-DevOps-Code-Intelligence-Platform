import React, { useState } from 'react';
import { Finding, Project, Analysis } from '../types';
import { FindingCard } from '../components/FindingCard';
import { ShieldAlert, ShieldCheck, Key, Lock, Terminal, Database, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SecurityProps {
  findings: Finding[];
  project: Project | null;
  analysis: Analysis | null;
  onExplainInAI: (finding: Finding) => void;
  onOpenFile: (file: string, line: number) => void;
}

export const Security: React.FC<SecurityProps> = ({
  findings,
  project,
  analysis,
  onExplainInAI,
  onOpenFile,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Filter for SECURITY findings
  const securityFindings = findings.filter((f) => f.type === 'SECURITY');

  const filtered = securityFindings.filter((f) => {
    if (severityFilter === 'ALL') return true;
    return f.severity === severityFilter;
  });

  const secScore = analysis?.security_score ?? 74;

  const chartData = [
    { name: 'Critical', value: securityFindings.filter((f) => f.severity === 'CRITICAL').length, color: '#f43f5e' },
    { name: 'High', value: securityFindings.filter((f) => f.severity === 'HIGH').length, color: '#f97316' },
    { name: 'Medium', value: securityFindings.filter((f) => f.severity === 'MEDIUM').length, color: '#eab308' },
    { name: 'Low', value: securityFindings.filter((f) => f.severity === 'LOW').length, color: '#38bdf8' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header & Security Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Security & Vulnerability Scanner</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Static analysis detecting credential leakage, SQL injections, and CWE vectors
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Secrets
                </span>
                <span className="text-lg font-bold text-white mt-1 block font-mono">
                  {securityFindings.filter((f) => f.title.toLowerCase().includes('secret') || f.title.toLowerCase().includes('key')).length}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-400" /> Injections
                </span>
                <span className="text-lg font-bold text-white mt-1 block font-mono">
                  {securityFindings.filter((f) => f.title.toLowerCase().includes('sql')).length}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" /> Subprocess
                </span>
                <span className="text-lg font-bold text-white mt-1 block font-mono">
                  {securityFindings.filter((f) => f.title.toLowerCase().includes('subprocess') || f.title.toLowerCase().includes('command')).length}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-400" /> Cryptography
                </span>
                <span className="text-lg font-bold text-white mt-1 block font-mono">
                  {securityFindings.filter((f) => f.title.toLowerCase().includes('hash') || f.title.toLowerCase().includes('crypto')).length}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-2">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  severityFilter === sev
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Security Score Gauge */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Security Health Rating</span>
          <div className="my-4 relative flex items-center justify-center">
            <div className={`text-5xl font-extrabold ${secScore > 75 ? 'text-emerald-400' : secScore > 50 ? 'text-amber-400' : 'text-rose-400'} font-mono`}>
              {Math.round(secScore)}
            </div>
            <span className="text-xs text-slate-400 ml-1">/ 100</span>
          </div>

          <p className="text-xs text-slate-400 max-w-xs">
            {secScore > 75
              ? 'Strong security posture. Minimal high-severity vectors detected.'
              : 'Action required: Detected credentials and insecure endpoints.'}
          </p>

          {chartData.length > 0 && (
            <div className="w-full h-32 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value">
                    {chartData.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Findings List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Security Vulnerabilities Detected</h3>
          <p className="text-xs text-slate-400 mt-1">
            {severityFilter !== 'ALL'
              ? `No findings match '${severityFilter}' severity.`
              : 'Repository is free of scanned secrets and critical execution patterns.'}
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
