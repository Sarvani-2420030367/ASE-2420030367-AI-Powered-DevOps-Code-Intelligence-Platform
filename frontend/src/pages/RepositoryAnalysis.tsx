
import React, { useState } from 'react';
import {
  Upload,
  GitBranch,
  Sparkles,
  FileArchive,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import { Project } from '../types';
import { api } from '../services/api';
import { AnalysisStepper } from '../components/AnalysisStepper';

interface RepositoryAnalysisProps {
  project: Project | null;
  onAnalysisSuccess: () => void;
  onLoadDemo: () => void;
}

export const RepositoryAnalysis: React.FC<RepositoryAnalysisProps> = ({
  project,
  onAnalysisSuccess,
  onLoadDemo
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ZIP file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError(null);

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setFile(null);
      setError('Please select a valid .zip repository file.');
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setFile(null);
      setError('File size must not exceed 50 MB.');
      return;
    }

    setFile(selectedFile);
  };

  // Upload ZIP and start backend repository analysis
  const handleUploadZip = async () => {
    if (!project) {
      setError('Please select or create an active project first.');
      return;
    }

    if (!file) {
      setError('Please select a .zip repository file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Backend extracts the ZIP and performs repository analysis.
      await api.post(
        `/api/projects/${project.id}/repository/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Backend analysis is complete when the request succeeds.
      // Show the stepper animation before navigating to dashboard.
      setAnalyzingProgress(true);

    } catch (err: any) {
      console.error('Repository upload failed:', err);

      setError(
        err.response?.data?.detail ||
        'Failed to upload or analyze the repository. Please try again.'
      );

      setUploading(false);
    }
  };

  // GitHub import is not connected to a clone endpoint yet.
  // Import and analyze a GitHub repository
const handleConnectGithub = async () => {
  if (!project) {
    setError('Please select or create an active project first.');
    return;
  }

  if (!githubUrl.trim()) {
    setError('Please enter a GitHub repository URL.');
    return;
  }

  setUploading(true);
  setError(null);

  const formData = new FormData();
  formData.append('github_url', githubUrl.trim());

  try {
    await api.post(
      `/api/projects/${project.id}/repository/github-import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Backend analysis is complete. Show the progress stepper.
    setAnalyzingProgress(true);

  } catch (err: any) {
    console.error('GitHub import failed:', err);

    setError(
      err.response?.data?.detail ||
      'Failed to import GitHub repository. Please try again.'
    );

    setUploading(false);
  }
};
  // Called when AnalysisStepper finishes.
  const handleAnalysisComplete = () => {
    setAnalyzingProgress(false);
    setUploading(false);

    // Parent component refreshes analysis, findings and repository data.
    onAnalysisSuccess();
  };

  // Display analysis progress
  if (analyzingProgress) {
    return (
      <div className="py-12">
        <AnalysisStepper
          onComplete={handleAnalysisComplete}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Repository Analysis
        </h1>

        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Upload a project archive, connect via GitHub, or launch
          the demo repository to perform deep multi-language
          static quality and security analysis.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Method 1: ZIP Upload */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">

          <div className="space-y-4">

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
                <FileArchive className="w-5 h-5 text-sky-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Upload Repository Archive
                </h3>

                <p className="text-[11px] text-slate-400">
                  Supported format: .zip (max 50MB)
                </p>
              </div>
            </div>

            {/* File Selection */}
            <label className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">

              <Upload className="w-8 h-8 text-slate-500 mb-2" />

              <span className="text-xs font-semibold text-slate-200 text-center break-all">
                {file
                  ? file.name
                  : 'Choose a ZIP file or drag & drop'}
              </span>

              <span className="text-[10px] text-slate-400 mt-1">
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : 'Python, JS/TS, Java, Go, C/C++'}
              </span>

              <input
                type="file"
                accept=".zip,application/zip"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>

          </div>

          <button
            onClick={handleUploadZip}
            disabled={!file || uploading || !project}
            className="w-full mt-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {uploading
              ? 'Extracting & Scanning...'
              : 'Start Code Analysis'}

            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

        {/* Method 2: GitHub URL Connection */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">

          <div className="space-y-4">

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Import from GitHub
                </h3>

                <p className="text-[11px] text-slate-400">
                  Import and scan public repositories
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Repository URL
              </label>

              <input
                type="url"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://github.com/torvalds/linux"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-400 space-y-1">

              <span className="font-semibold text-slate-300 block">
                Automatic Repository Processing:
              </span>

              <p>• Clone and extract public GitHub repositories</p>
<p>• Detect languages and scan code vulnerabilities</p>
<p>• Analyze dependencies and generate code insights</p>

            </div>

          </div>

          <button
            onClick={handleConnectGithub}
            disabled={!githubUrl.trim() || uploading || !project}
            className="w-full mt-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {uploading ? 'Importing & Scanning...' : 'Import from GitHub'}

            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Demo Project Quick Option */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="space-y-1">

          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />

            <h3 className="text-sm font-bold text-white">
              Instant Demo Mode
            </h3>
          </div>

          <p className="text-xs text-slate-400 text-center sm:text-left">
            Don't have a ZIP ready? Load our pre-packaged sample
            repository containing realistic microservices and
            deliberate vulnerabilities.
          </p>

        </div>

        <button
          onClick={onLoadDemo}
          disabled={uploading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shrink-0 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-40"
        >
          Load Demo Project
        </button>

      </div>

    </div>
  );
};
