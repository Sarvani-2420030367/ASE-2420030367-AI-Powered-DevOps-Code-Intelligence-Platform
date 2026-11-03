
import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  FolderOpen,
  Sparkles,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { Project } from '../types';

interface NavbarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onLoadDemo: () => void;
  userName?: string;
  onLogout: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onLoadDemo,
  userName = 'Developer',
  onLogout,
  isLightMode,
  onToggleTheme
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">

      <div className="flex items-center gap-4">

        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            <FolderOpen className="w-4 h-4 text-sky-400" />

            <span className="font-semibold text-white max-w-[150px] truncate">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">

              <div className="px-3 py-1.5 border-b border-slate-800">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Available Repositories
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto py-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                      activeProject?.id === p.id
                        ? 'bg-sky-500/10 text-sky-400 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.primary_language}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLoadDemo();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm shadow-sky-500/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Demo Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />

          <input
            type="text"
            placeholder="Search code, CVEs, findings..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500 text-slate-300 hover:text-sky-400 transition-all"
        >
          {isLightMode ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* Demo Mode */}
        <button
          onClick={onLoadDemo}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          Demo Mode
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 relative transition-colors">
          <Bell className="w-4 h-4" />

          <span className="w-2 h-2 rounded-full bg-sky-400 absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>

            <span className="text-xs font-medium text-slate-200 hidden sm:inline">
              {userName}
            </span>

            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">

              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white truncate">
                  {userName}
                </p>

                <p className="text-[10px] text-slate-400">
                  Signed in with DevSight
                </p>
              </div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
