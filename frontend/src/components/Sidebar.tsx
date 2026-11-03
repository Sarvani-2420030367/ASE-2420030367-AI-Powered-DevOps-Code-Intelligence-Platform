import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  GitPullRequest,
  ShieldAlert,
  Sparkles,
  Container,
  GitFork,
  Boxes,
  FileCode2,
  Settings,
  Terminal,
  Activity
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  projectName?: string;
  primaryLanguage?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  projectName = 'No Project',
  primaryLanguage = 'Detecting'
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'repository-analysis', label: 'Repository Analysis', icon: GitPullRequest },
    { id: 'explorer', label: 'Codebase Explorer', icon: FileCode2 },
    { id: 'code-quality', label: 'Code Quality', icon: Activity },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'ai-assistant', label: 'AI Code Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'deployment', label: 'Deployment Generator', icon: Container },
    { id: 'cicd', label: 'CI/CD Pipelines', icon: GitFork },
    { id: 'kubernetes', label: 'Kubernetes', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 backdrop-blur-md">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">DevSight</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                AI
              </span>
            </div>
            <span className="text-[11px] text-slate-400">DevOps & Code Intel</span>
          </div>
        </div>

        {/* Active Project Indicator */}
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Active Workspace</p>
            <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{projectName}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700 font-mono">
            {primaryLanguage}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="px-2.5 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-gradient-to-r from-purple-500/20 to-sky-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Engine Online
          </span>
          <span className="font-mono text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
