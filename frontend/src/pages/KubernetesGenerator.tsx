import React, { useState, useEffect } from 'react';
import { Project, Artifact } from '../types';
import { api } from '../services/api';
import { ArtifactViewer } from '../components/ArtifactViewer';
import { Boxes, RefreshCw, Sliders, CheckCircle2 } from 'lucide-react';

interface KubernetesGeneratorProps {
  project: Project | null;
}

export const KubernetesGenerator: React.FC<KubernetesGeneratorProps> = ({ project }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('deployment.yaml');
  const [appName, setAppName] = useState<string>('');
  const [port, setPort] = useState<number>(8000);
  const [replicas, setReplicas] = useState<number>(2);
  const [cpuLimit, setCpuLimit] = useState<string>('500m');
  const [memoryLimit, setMemoryLimit] = useState<string>('512Mi');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project?.id) {
      setAppName(project.name.toLowerCase().replace(/\s+/g, '-'));
      handleGenerate();
    }
  }, [project?.id]);

  const handleGenerate = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const resp = await api.post(`/api/projects/${project.id}/generate/kubernetes`, {
        project_id: project.id,
        app_name: appName || project.name.toLowerCase().replace(/\s+/g, '-'),
        port,
        replicas,
        cpu_limit: cpuLimit,
        memory_limit: memoryLimit,
      });
      setArtifacts(resp.data);
    } catch (err) {
      console.error('Failed to generate K8s manifests', err);
    } finally {
      setLoading(false);
    }
  };

  const currentArtifact = artifacts.find((a) => a.filename === selectedFile) || artifacts[0];

  const manifestFiles = [
    'deployment.yaml',
    'service.yaml',
    'configmap.yaml',
    'secret.yaml',
    'ingress.yaml',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Kubernetes Manifests Generator</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-grade cloud-native specs including Deployments, Services, Ingress, and Secret vaults
            </p>
          </div>
        </div>

        {/* Configuration Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">App Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Container Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Replicas</label>
            <input
              type="number"
              min={1}
              max={20}
              value={replicas}
              onChange={(e) => setReplicas(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">CPU Limit</label>
            <input
              type="text"
              value={cpuLimit}
              onChange={(e) => setCpuLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Memory Limit</label>
            <input
              type="text"
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Generate Kubernetes Manifests
          </button>
        </div>
      </div>

      {/* Manifest Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        {manifestFiles.map((fn) => (
          <button
            key={fn}
            onClick={() => setSelectedFile(fn)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
              selectedFile === fn
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {fn}
          </button>
        ))}
      </div>

      {/* Manifest Editor */}
      {currentArtifact ? (
        <ArtifactViewer
          filename={currentArtifact.filename}
          content={currentArtifact.content}
          language="yaml"
        />
      ) : (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400">Loading Kubernetes manifests...</p>
        </div>
      )}
    </div>
  );
};
