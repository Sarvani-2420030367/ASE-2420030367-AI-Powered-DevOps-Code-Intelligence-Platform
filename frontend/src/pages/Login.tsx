import React, { useState } from 'react';
import { Terminal, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onSuccess: (token: string, user: any) => void;
  onGoToRegister: () => void;
  onGoToLanding: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onGoToRegister, onGoToLanding }) => {
  const [email, setEmail] = useState('demo@devsight.ai');
  const [password, setPassword] = useState('DevSightDemo2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await api.post('/api/auth/login', { email, password });
      const { access_token, user } = resp.data;
      localStorage.setItem('devsight_token', access_token);
      onSuccess(access_token, user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0f] flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-6">
          <button onClick={onGoToLanding} className="inline-block hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 mb-3">
              <Terminal className="w-6 h-6 text-white" />
            </div>
          </button>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to DevSight AI</h2>
          <p className="text-xs text-slate-400 mt-1">DevOps and Code Intelligence Console</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button onClick={onGoToRegister} className="text-sky-400 hover:underline font-medium">
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
