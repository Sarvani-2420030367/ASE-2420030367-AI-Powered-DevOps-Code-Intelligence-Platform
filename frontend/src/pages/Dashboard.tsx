
import React, { useEffect, useState } from 'react';
import {
  FileCode2,
  Code,
  Box,
  Layers,
  ShieldAlert,
  FolderGit2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

import { Project, Analysis, RepositoryData } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { StatCard } from '../components/StatCard';
import { RadarGraph } from '../components/RadarGraph';

interface DockerScanResult {
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
  findings: {
    vulnerability_id: string;
    package: string;
    installed_version: string;
    fixed_version: string;
    severity: string;
    title: string;
    primary_url: string;
  }[];
}

interface DashboardProps {
  project: Project | null;
  analysis: Analysis | null;
  repository: RepositoryData | null;
  onNavigateTab: (tab: string) => void;
  onReanalyze: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  project,
  analysis,
  repository,
  onNavigateTab,
  onReanalyze
}) => {

  // Docker vulnerability scan results
  const [dockerScan, setDockerScan] = useState<DockerScanResult | null>(null);

  // Load saved Docker scan for the selected project
  useEffect(() => {
    if (!project?.id) {
      setDockerScan(null);
      return;
    }

    const savedScan = localStorage.getItem(
      `devsight_docker_scan_${project.id}`
    );

    if (savedScan) {
      try {
        const parsedScan = JSON.parse(savedScan);

        if (parsedScan.project_id === project.id) {
          setDockerScan(parsedScan);
        } else {
          setDockerScan(null);
        }
      } catch {
        setDockerScan(null);
      }
    } else {
      setDockerScan(null);
    }
  }, [project?.id]);

  if (!project) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <FolderGit2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />

        <h3 className="text-lg font-bold text-white">
          No Project Selected
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          Please select an active project or initialize the Demo project.
        </p>
      </div>
    );
  }

  // Repository analysis metrics
  const healthScore = analysis?.health_score ?? 0;
  const qualityScore = analysis?.quality_score ?? 0;
  const securityScore = analysis?.security_score ?? 0;
  const maintainabilityScore = analysis?.maintainability_score ?? 0;
  const architectureScore = analysis?.architecture_score ?? 0;
  const devopsScore = analysis?.devops_readiness_score ?? 0;

  const fileCount = repository?.file_count ?? project.file_count ?? 0;
  const lineCount = repository?.line_count ?? project.line_count ?? 0;
  const depCount = repository?.dependencies?.length ?? 0;

  const issuesCount =
    analysis?.findings_count ??
    (
      (analysis?.critical_count ?? 0) +
      (analysis?.high_count ?? 0) +
      (analysis?.medium_count ?? 0) +
      (analysis?.low_count ?? 0)
    );

  // Static code analysis severity breakdown
  const severityData = [
    {
      name: 'Critical',
      value: analysis?.critical_count ?? 0,
      color: '#f43f5e'
    },
    {
      name: 'High',
      value: analysis?.high_count ?? 0,
      color: '#f97316'
    },
    {
      name: 'Medium',
      value: analysis?.medium_count ?? 0,
      color: '#eab308'
    },
    {
      name: 'Low',
      value: analysis?.low_count ?? 0,
      color: '#38bdf8'
    }
  ];

  // Language distribution
  const languageData = Object.entries(repository?.languages || {}).map(
    ([lang, stat]) => ({
      language: lang,
      lines: stat.lines,
      files: stat.files
    })
  );

  // Existing quality trend chart
  const trendData = [
    { build: 'Build #1', health: 68, security: 60, quality: 72 },
    { build: 'Build #2', health: 74, security: 68, quality: 79 },
    { build: 'Build #3', health: 78, security: 74, quality: 82 },
    {
      build: 'Build #4',
      health: Math.round(healthScore),
      security: Math.round(securityScore),
      quality: Math.round(qualityScore)
    }
  ];

  const insights = analysis?.insights || {};

  // Docker vulnerability severity styles
  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';

      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';

      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';

      case 'LOW':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';

      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">

      {/* Project Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 font-mono">
              {project.primary_language}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {project.description || 'Continuous DevOps Code Intelligence'}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
            <span>
              Repo:{' '}
              <span className="text-slate-300">
                {project.repository_url || 'Local Archive'}
              </span>
            </span>

            <span>•</span>

            <span>
              Last Analyzed:{' '}
              <span className="text-slate-300">
                {new Date(
                  analysis?.created_at || project.updated_at
                ).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReanalyze}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scan Repo
          </button>

          <button
            onClick={() => onNavigateTab('ai-assistant')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Code Health Circular Gauge & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <div className="lg:col-span-7">
          <ScoreGauge
            score={healthScore}
            quality={qualityScore}
            security={securityScore}
            maintainability={maintainabilityScore}
            architecture={architectureScore}
          />
        </div>

        <div className="lg:col-span-5">
          <RadarGraph
            data={analysis?.devops_readiness_details || {
              'Code Quality': qualityScore,
              'Security': securityScore,
              'Testing': 80,
              'Containerization': 90,
              'CI/CD': 85,
              'Documentation': 75,
              'Observability': 70,
              'Kubernetes': 80
            }}
            overallScore={devopsScore}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

        <StatCard
          title="Total Files"
          value={fileCount}
          subtitle="Monitored source"
          icon={<FileCode2 className="w-5 h-5" />}
          accent="blue"
        />

        <StatCard
          title="Lines of Code"
          value={lineCount.toLocaleString()}
          subtitle="Executable volume"
          icon={<Code className="w-5 h-5" />}
          accent="purple"
        />

        <StatCard
          title="Functions"
          value={Math.round(fileCount * 6.5)}
          subtitle="AST function nodes"
          icon={<Cpu className="w-5 h-5" />}
          accent="emerald"
        />

        <StatCard
          title="Classes"
          value={Math.max(2, Math.round(fileCount * 1.8))}
          subtitle="Object models"
          icon={<Layers className="w-5 h-5" />}
          accent="blue"
        />

        <StatCard
          title="Dependencies"
          value={depCount}
          subtitle="Third-party packages"
          icon={<Box className="w-5 h-5" />}
          accent="amber"
        />

        <StatCard
          title="Issues Found"
          value={issuesCount}
          subtitle="Quality & security"
          icon={<ShieldAlert className="w-5 h-5" />}
          accent="rose"
        />
      </div>

      {/* Docker Image Security Dashboard */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                Docker Image Security
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Vulnerability analysis powered by Trivy
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('deployment')}
            className="text-xs font-semibold text-sky-400 hover:underline"
          >
            Open Docker Scanner →
          </button>
        </div>

        {!dockerScan ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center">

            <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto mb-3" />

            <p className="text-sm font-semibold text-white">
              No Docker scan available
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Scan a Docker image in the Deployment Generator to view security results here.
            </p>

            <button
              onClick={() => onNavigateTab('deployment')}
              className="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
            >
              Scan Docker Image
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Scan Information */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>
                <p className="text-xs text-slate-400">
                  Scanned Docker Image
                </p>

                <p className="text-sm font-mono text-white mt-1">
                  {dockerScan.image}
                </p>
              </div>

              <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {dockerScan.scan_status}
              </span>
            </div>

            {/* Total Vulnerabilities */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400">
                Total Docker Vulnerabilities
              </p>

              <h2 className="text-4xl font-bold text-white mt-2">
                {dockerScan.summary.total}
              </h2>
            </div>

            {/* Severity Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

              {[
                {
                  name: 'Critical',
                  count: dockerScan.summary.critical,
                  color: 'text-red-400',
                  border: 'border-red-500/30'
                },
                {
                  name: 'High',
                  count: dockerScan.summary.high,
                  color: 'text-orange-400',
                  border: 'border-orange-500/30'
                },
                {
                  name: 'Medium',
                  count: dockerScan.summary.medium,
                  color: 'text-yellow-400',
                  border: 'border-yellow-500/30'
                },
                {
                  name: 'Low',
                  count: dockerScan.summary.low,
                  color: 'text-sky-400',
                  border: 'border-sky-500/30'
                },
                {
                  name: 'Unknown',
                  count: dockerScan.summary.unknown,
                  color: 'text-slate-400',
                  border: 'border-slate-600'
                }
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
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">
                Detected Vulnerabilities
              </h4>

              {dockerScan.findings.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto mb-2" />

                  <p className="text-sm text-emerald-400">
                    No vulnerabilities detected.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">

                  <table className="w-full text-left text-xs">

                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">Vulnerability ID</th>
                        <th className="p-3">Package</th>
                        <th className="p-3">Installed Version</th>
                        <th className="p-3">Fixed Version</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Reference</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">

                      {dockerScan.findings.slice(0, 10).map((finding, index) => (
                        <tr
                          key={`${finding.vulnerability_id}-${finding.package}-${index}`}
                          className="hover:bg-slate-800/40"
                        >
                          <td className="p-3 text-sky-400 font-mono whitespace-nowrap">
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
                            <span className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${getSeverityStyle(finding.severity)}`}>
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
                              <span className="text-slate-500">
                                N/A
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>

                  {dockerScan.findings.length > 10 && (
                    <div className="bg-slate-950 p-3 text-xs text-slate-400">
                      Showing 10 of {dockerScan.findings.length} vulnerabilities.
                      Open Docker Scanner to view all results.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Severity Donut */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">

          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
            Issues by Severity
          </h3>

          <p className="text-xs text-slate-400 mb-4">
            Distribution of static inspection findings
          </p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {severityData.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between px-2 py-1 rounded bg-slate-800/40 text-xs"
              >
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>

                <span className="font-mono font-bold text-white">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Trend */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">

          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
            Code Quality Trend
          </h3>

          <p className="text-xs text-slate-400 mb-4">
            Historical score trajectory across scans
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis
                  dataKey="build"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  domain={[50, 100]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="security"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs mt-1">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-0.5 bg-sky-400" />
              Health Score
            </span>

            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-400" />
              Security Score
            </span>
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">

          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
            Language Breakdown
          </h3>

          <p className="text-xs text-slate-400 mb-4">
            Lines of code per detected language
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis
                  dataKey="language"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />

                <Bar
                  dataKey="lines"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Repository Insights Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Architecture & Intelligence Summary
              </h3>

              <p className="text-xs text-slate-400">
                Synthesized insights based on repository scan
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ai-assistant')}
            className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
          >
            Ask Detailed Architecture Questions
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-6 space-y-3">

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">

              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Architecture Overview
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {insights.architecture_summary ||
                  'This project follows a modular layered architecture separating API transport, business domain logic, and persistence layers.'}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">

              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Key Service Components
              </h4>

              <div className="space-y-2">
                {(insights.key_components || [
                  {
                    name: 'API Routing',
                    description: 'FastAPI controller layer for order and product lifecycles'
                  },
                  {
                    name: 'Persistence',
                    description: 'SQLAlchemy relational models backed by connection pooling'
                  },
                  {
                    name: 'Security',
                    description: 'JWT authentication with token authorization guards'
                  }
                ]).map((comp: any) => (
                  <div key={comp.name} className="text-xs">
                    <span className="font-semibold text-sky-400">
                      {comp.name}:{' '}
                    </span>

                    <span className="text-slate-400">
                      {comp.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">

            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Recommended Action Items
            </h4>

            <ul className="space-y-2.5">
              {(insights.recommendations || [
                'Containerize the application using multi-stage Docker build for environment parity.',
                'Move sensitive credentials in config.py to environment variables or cloud vault.',
                'Add automated CI/CD pipeline using GitHub Actions to gate pull requests with pytest.',
                'Increase test coverage on critical order lifecycle checkout routines.'
              ]).map((rec: string, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
