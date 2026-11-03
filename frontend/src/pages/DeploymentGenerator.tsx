
import React, { useState, useEffect } from 'react';
import { Project, Artifact } from '../types';
import { api } from '../services/api';
import { ArtifactViewer } from '../components/ArtifactViewer';
import {
  Container,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Search
} from 'lucide-react';

interface Vulnerability {
  target: string;
  package: string;
  installed_version: string;
  fixed_version: string;
  vulnerability_id: string;
  severity: string;
  title: string;
  primary_url: string;
}

interface ScanResult {
  project_id: string;
  project_name: string;
  image: string;
  scan_status: string;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  findings: Vulnerability[];
}

interface DeploymentGeneratorProps {
  project: Project | null;
}

export const DeploymentGenerator: React.FC<DeploymentGeneratorProps> = ({ project }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('Dockerfile');
  const [port, setPort] = useState<number>(8000);
  const [loading, setLoading] = useState(false);

  // Docker security scanner states
  const [imageName, setImageName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
  setArtifacts([]);
  setScanResult(null);
  setScanError('');
  setImageName('');
  setScanning(false);
  setScanStage('');

  if (project?.id) {
    const savedScan = localStorage.getItem(
      `devsight_docker_scan_${project.id}`
    );

    if (savedScan) {
      try {
        const parsedScan = JSON.parse(savedScan);

        if (parsedScan.project_id === project.id) {
          setScanResult(parsedScan);
          setImageName(parsedScan.image || '');
        }
      } catch {
        setScanResult(null);
      }
    }

    loadArtifacts();
  }
}, [project?.id]);
  const loadArtifacts = async () => {
    try {
      const resp = await api.get(`/api/projects/${project!.id}/artifacts`);

      const dockerArtifacts = resp.data.filter((a: Artifact) =>
        ['dockerfile', 'docker-compose', 'dockerignore'].includes(a.artifact_type)
      );

      if (dockerArtifacts.length > 0) {
        setArtifacts(dockerArtifacts);
      } else {
        handleGenerate();
      }
    } catch (err) {
      console.error('Failed to load artifacts', err);
    }
  };

  const handleGenerate = async () => {
    if (!project) return;

    setLoading(true);

    try {
      const resp = await api.post(`/api/projects/${project.id}/generate/docker`, {
        project_id: project.id,
        port: port,
      });

      setArtifacts(resp.data);
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Run Trivy Docker image vulnerability scan
  
// Automatically build the project's Docker image and scan it using Trivy
const handleDockerScan = async () => {
  if (!project) return;

  setScanning(true);
  setScanError('');
  setScanResult(null);
  setScanStage('Building Docker image...');

  try {
    // STEP 1: Build a Docker image for the selected project
    const buildResponse = await api.post(
      `/api/projects/${project.id}/docker/build`
    );

    const builtImage = buildResponse.data?.image;

    if (!builtImage) {
      throw new Error('Docker build completed without returning an image name.');
    }

    setImageName(builtImage);

    // STEP 2: Scan the newly built project-specific image
    setScanStage('Scanning Docker image with Trivy...');

    const scanResponse = await api.post(
      `/api/projects/${project.id}/docker-security/scan`,
      {
        image: builtImage
      }
    );

    // STEP 3: Save and display scan results
    setScanResult(scanResponse.data);

    localStorage.setItem(
      `devsight_docker_scan_${project.id}`,
      JSON.stringify(scanResponse.data)
    );

    setScanStage('Scan completed successfully!');

  } catch (err: any) {
    console.error('Docker build or scan failed:', err);

    const detail = err.response?.data?.detail;

    let message =
      typeof detail === 'string'
        ? detail
        : detail?.message || err.message ||
          'Unable to build or scan Docker image.';

    if (detail?.logs) {
      message += '\n\nDocker logs:\n' + detail.logs.slice(-2500);
    }

    setScanError(message);
  } finally {
    setScanning(false);
  }
};


  const currentArtifact =
    artifacts.find((a) => a.filename === selectedFile) || artifacts[0];

  const severityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };
  // Generate vulnerability fix recommendations
const getFixRecommendation = (finding: Vulnerability) => {
  if (finding.fixed_version && finding.fixed_version.trim() !== '') {
    return {
      status: 'Fix Available',
      recommendation: `Upgrade ${finding.package} from ${finding.installed_version} to ${finding.fixed_version}.`,
      color: 'text-emerald-400'
    };
  }

  return {
    status: 'No Fix Available',
    recommendation: `No fixed version is currently provided by Trivy. Review ${finding.vulnerability_id} and consider an alternative package version or image.`,
    color: 'text-yellow-400'
  };
};

  return (
    <div className="space-y-6">

      {/* Docker Generator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Container className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Docker & Containerization Generator
              </h1>

              <p className="text-xs text-slate-400 mt-0.5">
                Automatically tailored container builds based on detected tech stack ({project?.primary_language})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <label className="text-xs text-slate-400 font-mono">Port:</label>

            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-16 bg-transparent text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !project}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {artifacts.length > 0 ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Docker Artifact Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        {['Dockerfile', 'docker-compose.yml', '.dockerignore'].map((fn) => (
          <button
            key={fn}
            onClick={() => setSelectedFile(fn)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
              selectedFile === fn
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {fn}
          </button>
        ))}
      </div>

      {/* Docker Artifact Viewer */}
      {currentArtifact ? (
        <ArtifactViewer
          filename={currentArtifact.filename}
          content={currentArtifact.content}
          language={currentArtifact.filename.endsWith('.yml') ? 'yaml' : 'dockerfile'}
        />
      ) : (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400">
            Click Generate to create container manifests for this project.
          </p>
        </div>
      )}

      {/* Docker Image Security Scanner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Docker Image Vulnerability Scanner
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Scan Docker images using Trivy and identify security vulnerabilities.
            </p>
          </div>
        </div>

        {/* Image Input */}
        
{/* Automatic Project Docker Build and Scan */}
<div className="space-y-3">
  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <p className="text-xs text-slate-400">Selected Project</p>

    <p className="text-sm font-semibold text-white mt-1">
      {project?.name || 'No project selected'}
    </p>

    <p className="text-xs text-slate-500 mt-2">
      DevSight AI will build a Docker image specifically
      for this repository and scan it using Trivy.
    </p>

    {imageName && (
      <p className="text-xs text-emerald-400 mt-3 break-all">
        Last scanned image: {imageName}
      </p>
    )}
  </div>

  <button
    onClick={handleDockerScan}
    disabled={scanning || !project}
    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
  >
    {scanning ? (
      <RefreshCw className="w-4 h-4 animate-spin" />
    ) : (
      <ShieldCheck className="w-4 h-4" />
    )}

    {scanning ? scanStage : 'Build & Scan Project'}
  </button>
</div>

{/* Loading Status */}
{scanning && (
  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-center">
    <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-3" />

    <p className="text-sm text-white font-medium">{scanStage}</p>

    <p className="text-xs text-slate-400 mt-2">
      {scanStage.includes('Building')
        ? 'Creating a Docker image from your uploaded repository.'
        : 'Trivy is checking the generated image for known vulnerabilities.'}
    </p>

    <p className="text-xs text-slate-500 mt-2">
      Please wait. This operation may take a few minutes.
    </p>
  </div>
)}


        {/* Error */}
        {/* Error */}
{scanError && (
  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
    <div className="flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-red-400" />
      <p className="text-sm font-semibold text-red-400">
        Docker Build or Scan Failed
      </p>
    </div>

    <pre className="text-xs text-red-300 mt-2 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
      {scanError}
    </pre>
  </div>
)}

        {/* Scan Results */}
        {scanResult && !scanning && (
          <div className="space-y-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />

                  <h3 className="font-semibold text-white">
                    Scan Completed
                  </h3>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Image: {scanResult.image}
                </p>
              </div>

              <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {scanResult.scan_status}
              </span>
            </div>

            {/* Total Vulnerabilities */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400">
                Total Vulnerabilities Detected
              </p>

              <h2 className="text-4xl font-bold text-white mt-2">
                {scanResult.summary.total}
              </h2>
            </div>

            {/* Severity Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { name: 'Critical', count: scanResult.summary.critical, color: 'text-red-400', border: 'border-red-500/30' },
                { name: 'High', count: scanResult.summary.high, color: 'text-orange-400', border: 'border-orange-500/30' },
                { name: 'Medium', count: scanResult.summary.medium, color: 'text-yellow-400', border: 'border-yellow-500/30' },
                { name: 'Low', count: scanResult.summary.low, color: 'text-blue-400', border: 'border-blue-500/30' },
                { name: 'Unknown', count: scanResult.summary.unknown, color: 'text-slate-400', border: 'border-slate-600' }
              ].map((item) => (
                <div
                  key={item.name}
                  className={`bg-slate-950 border ${item.border} rounded-xl p-4`}
                >
                  <p className="text-xs text-slate-400">
                    {item.name}
                  </p>

                  <p className={`text-2xl font-bold mt-2 ${item.color}`}>
                    {item.count}
                  </p>
                </div>
              ))}
            </div>

            {/* Vulnerability Details */}
            {/* AI Fix Recommendations */}
<div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">

  <div className="flex items-center gap-2">
    <ShieldCheck className="w-5 h-5 text-emerald-400" />

    <div>
      <h3 className="text-sm font-bold text-white">
        Vulnerability Fix Recommendations
      </h3>

      <p className="text-xs text-slate-400 mt-1">
        Recommended actions based on Trivy vulnerability findings.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

    <div className="bg-slate-900 border border-emerald-500/20 rounded-lg p-4">
      <p className="text-xs text-slate-400">
        Fix Available
      </p>

      <p className="text-2xl font-bold text-emerald-400 mt-1">
        {scanResult.findings.filter(
          finding => finding.fixed_version?.trim()
        ).length}
      </p>
    </div>

    <div className="bg-slate-900 border border-yellow-500/20 rounded-lg p-4">
      <p className="text-xs text-slate-400">
        No Fix Version Provided
      </p>

      <p className="text-2xl font-bold text-yellow-400 mt-1">
        {scanResult.findings.filter(
          finding => !finding.fixed_version?.trim()
        ).length}
      </p>
    </div>

  </div>

  <div className="space-y-3">

    {scanResult.findings.slice(0, 10).map((finding, index) => {
      const fix = getFixRecommendation(finding);

      return (
        <div
          key={`${finding.vulnerability_id}-${index}`}
          className="border border-slate-800 rounded-lg p-4"
        >

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

            <div>
              <p className="text-sm font-semibold text-white">
                {finding.vulnerability_id}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Package: {finding.package}
              </p>
            </div>

            <span className={`text-xs font-semibold ${fix.color}`}>
              {fix.status}
            </span>

          </div>

          <p className="text-xs text-slate-300 mt-3">
            {fix.recommendation}
          </p>

        </div>
      );
    })}

    {scanResult.findings.length > 10 && (
      <p className="text-xs text-slate-500">
        Showing recommendations for the first 10 findings.
      </p>
    )}

  </div>
</div>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Vulnerability Details
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Packages and versions identified by Trivy.
                </p>
              </div>

              {scanResult.findings.length === 0 ? (
                <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-xl">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />

                  <p className="text-sm text-emerald-400 font-medium">
                    No vulnerabilities detected.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">Vulnerability</th>
                        <th className="p-3">Package</th>
                        <th className="p-3">Installed</th>
                        <th className="p-3">Fixed Version</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Reference</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {scanResult.findings.map((finding, index) => (
                        <tr
                          key={`${finding.vulnerability_id}-${finding.package}-${index}`}
                          className="hover:bg-slate-800/40"
                        >
                          <td className="p-3 text-white font-mono whitespace-nowrap">
                            {finding.vulnerability_id}
                          </td>

                          <td className="p-3 text-slate-300">
                            {finding.package}
                          </td>

                          <td className="p-3 text-slate-400 font-mono">
                            {finding.installed_version}
                          </td>

                          <td className="p-3 text-emerald-400 font-mono">
                            {finding.fixed_version}
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${severityStyle(finding.severity)}`}>
                              {finding.severity}
                            </span>
                          </td>

                          <td className="p-3">
                            {finding.primary_url ? (
                              <a
                                href={finding.primary_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                              >
                                Details
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
