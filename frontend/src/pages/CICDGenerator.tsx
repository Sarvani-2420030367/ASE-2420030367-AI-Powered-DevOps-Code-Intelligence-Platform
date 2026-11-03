import React, { useState, useEffect } from 'react';
import { Project, Artifact } from '../types';
import { api } from '../services/api';
import { ArtifactViewer } from '../components/ArtifactViewer';
import { GitFork, RefreshCw, CheckCircle2, Layers } from 'lucide-react';

interface CICDGeneratorProps {
  project: Project | null;
}

export const CICDGenerator: React.FC<CICDGeneratorProps> = ({ project }) => {
  const [platform, setPlatform] = useState<'github' | 'gitlab'>('github');
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project?.id) {
      handleGenerate();
    }
  }, [project?.id, platform]);

  const handleGenerate = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const resp = await api.post(`/api/projects/${project.id}/generate/cicd`, {
        project_id: project.id,
        platform: platform,
      });
      setArtifact(resp.data);
    } catch (err) {
      console.error('Failed to generate CI/CD manifest', err);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    'Checkout',
    'Install Dependencies',
    'Lint (Flake8 / ESLint)',
    'Automated Testing (Pytest / Jest)',
    'Security Vulnerability Scan (Trivy)',
    'Container Build & Push',
    'Kubernetes Cluster Deployment'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <GitFork className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CI/CD Pipeline Generator</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated continuous integration and delivery pipelines with multi-tier gating
              </p>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setPlatform('github')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              platform === 'github'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            GitHub Actions
          </button>
          <button
            onClick={() => setPlatform('gitlab')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              platform === 'gitlab'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            GitLab CI
          </button>
        </div>
      </div>

      {/* Pipeline Stage Pills */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
          Integrated Pipeline Stages
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {stages.map((stage, idx) => (
            <div
              key={stage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 shrink-0"
            >
              <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </span>
              <span>{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Display */}
      {artifact ? (
        <ArtifactViewer
          filename={artifact.filename}
          content={artifact.content}
          language="yaml"
        />
      ) : (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400">Generating pipeline manifest...</p>
        </div>
      )}
    </div>
  );
};
