import React, { useState } from 'react';
import { Project } from '../types';
import { api } from '../services/api';
import { FolderGit2, Plus, Sparkles, Trash2, ArrowRight, Activity, ShieldCheck, Boxes } from 'lucide-react';

interface ProjectsProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (p: Project) => void;
  onLoadDemo: () => void;
  onRefreshProjects: () => void;
}

export const Projects: React.FC<ProjectsProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onLoadDemo,
  onRefreshProjects,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [language, setLanguage] = useState('Python');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const resp = await api.post('/api/projects', {
        name,
        description,
        repository_url: repoUrl,
        primary_language: language,
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setRepoUrl('');
      onRefreshProjects();
      onSelectProject(resp.data);
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/api/projects/${id}`);
        onRefreshProjects();
      } catch (err) {
        console.error('Failed to delete project', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Project Workspaces</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your monitored software repositories and team environments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Demo Project
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const isActive = proj.id === activeProjectId;
          const health = Math.round(proj.health_score ?? 82);
          const security = Math.round(proj.security_score ?? 78);
          const devops = Math.round(proj.devops_score ?? 76);

          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className={`bg-slate-900/80 border rounded-2xl p-5 hover:border-slate-700/80 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden backdrop-blur-sm ${
                isActive ? 'border-sky-500/40 ring-1 ring-sky-500/20' : 'border-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                      <FolderGit2 className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                        {proj.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {proj.primary_language}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(proj.id, e)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Score Indicators */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Health</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{health}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Security</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">{security}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">DevOps</span>
                    <span className="text-sm font-bold text-sky-400 font-mono">{devops}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {proj.file_count || 12} files • {proj.line_count?.toLocaleString() || 2450} LOC
                </span>
                <span className="text-xs font-semibold text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Open Project <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white tracking-tight mb-4">Create New Project</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Order Processing API"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Core backend handling inventory and checkout events"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Python">Python</option>
                  <option value="TypeScript">TypeScript / Node</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Java">Java</option>
                  <option value="Go">Go</option>
                  <option value="C++">C/C++</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Repository URL (Optional)</label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
