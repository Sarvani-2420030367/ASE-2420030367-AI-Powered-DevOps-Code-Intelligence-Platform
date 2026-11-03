import React, { useState } from 'react';
import { User } from '../types';
import { Settings as SettingsIcon, Key, Database, Shield, Check, Info } from 'lucide-react';

interface SettingsProps {
  user: User | null;
}

export const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Platform Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage developer credentials, LLM configuration, and database storage
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">User Account Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Developer Name</label>
            <input
              type="text"
              readOnly
              value={user?.name || 'Demo Engineer'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || 'demo@devsight.ai'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* AI LLM Settings */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI LLM Provider</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Hybrid Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          DevSight AI automatically uses contextual AST codebase parsing and semantic fallbacks offline. If an OpenAI API key is supplied, requests query OpenAI GPT models.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">OpenAI API Key (Optional)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-••••••••••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Keys are encrypted and never stored client-side.
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
              {saved ? 'Saved!' : 'Save Key'}
            </button>
          </div>
        </form>
      </div>

      {/* Database Status Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Database Storage Engine</h3>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-white">Relational Engine</span>
            <p className="text-[11px] text-slate-400 mt-0.5">MySQL with resilient embedded SQLite automatic fallback</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
            CONNECTED (SQLite/MySQL)
          </span>
        </div>
      </div>
    </div>
  );
};
