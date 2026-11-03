import React from 'react';
import {
  Sparkles,
  ShieldAlert,
  GitBranch,
  Container,
  GitFork,
  Boxes,
  Code2,
  Terminal,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Activity,
  Layers,
  Zap
} from 'lucide-react';

interface LandingProps {
  onStartAnalysis: () => void;
  onViewDemo: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const Landing: React.FC<LandingProps> = ({
  onStartAnalysis,
  onViewDemo,
  onLogin,
  onRegister
}) => {
  const features = [
    {
      title: 'AI Code Intelligence',
      description: 'Deep semantic and AST parsing of repository architecture with real-time codebase Q&A.',
      icon: Sparkles,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Code Quality Analysis',
      description: 'Pinpoints long functions, cyclomatic complexity, dead code, unhandled errors, and code smells.',
      icon: Activity,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Security Scanning',
      description: 'Detects hardcoded secrets, API tokens, SQL injection vectors, unsafe subprocesses, and CVE risks.',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Docker Generation',
      description: 'Auto-detects tech stack and writes production-ready, multi-stage Dockerfiles and compose stacks.',
      icon: Container,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'CI/CD Automation',
      description: 'Generates hardened GitHub Actions and GitLab CI workflows with lint, test, and security stages.',
      icon: GitFork,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Kubernetes Manifests',
      description: 'Outputs complete K8s Deployment, Service, ConfigMap, Secret, and Ingress YAML configs.',
      icon: Boxes,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Repository Insights',
      description: 'Summarizes architectural layers, key microservice components, and prioritized DevOps roadmaps.',
      icon: Layers,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'AI Developer Assistant',
      description: 'Context-aware interactive pair programmer with direct file-line citations and test generator.',
      icon: Terminal,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    }
  ];

  const techStack = [
    { name: 'Python', role: 'FastAPI Backend & AST Engine' },
    { name: 'React', role: 'Modern Component Dashboard' },
    { name: 'TypeScript', role: 'Type-Safe Architecture' },
    { name: 'Vite', role: 'High-Performance Bundler' },
    { name: 'Tailwind CSS', role: 'Dark Theme SaaS Design' },
    { name: 'MySQL', role: 'Relational Intelligence Store' },
    { name: 'SQLAlchemy', role: 'Database ORM Layer' },
    { name: 'Docker', role: 'Container Orchestration' },
  ];

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">DevSight AI</span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
            DevOps Platform
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm shadow-sky-500/20 transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full space-y-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-medium">
            <Zap className="w-3.5 h-3.5" /> Next-Gen DevOps & Code Intelligence
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            DevSight AI
          </h1>
          <p className="text-xl font-medium text-sky-400">
            AI-Powered DevOps & Code Intelligence Platform
          </p>
          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Analyze your codebase, identify quality and security issues, understand your architecture, and generate production-ready deployment artifacts with AI.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
            <button
              onClick={onStartAnalysis}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all"
            >
              Analyze Repository
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onViewDemo}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              View Demo
            </button>
          </div>
        </div>

        {/* Visual Dashboard Preview */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Browser Top Bar */}
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-xs font-mono text-slate-400">devsight-dashboard — E-Commerce API</span>
            <div className="text-xs text-sky-400 font-mono">Health: 82/100</div>
          </div>

          {/* Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase">Code Health</span>
              <p className="text-3xl font-bold text-emerald-400 mt-1 code-font">82 / 100</p>
              <span className="text-[11px] text-slate-400 mt-1 block">4-Pillar Quality Matrix</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase">Total Files</span>
              <p className="text-3xl font-bold text-white mt-1 code-font">148</p>
              <span className="text-[11px] text-slate-400 mt-1 block">18,420 Lines of Code</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase">Security Scan</span>
              <p className="text-3xl font-bold text-amber-400 mt-1 code-font">3 High</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Hardcoded Secrets Caught</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase">DevOps Readiness</span>
              <p className="text-3xl font-bold text-sky-400 mt-1 code-font">78%</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Docker & K8s Prepared</span>
            </div>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Platform Capabilities</h2>
            <p className="text-sm text-slate-400">Everything developers and DevOps teams need from commit to cloud.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">{feat.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise Modern Tech Stack</h2>
            <p className="text-xs text-slate-400">Engineered for low-latency analysis and rock-solid scalability.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {techStack.map((tech) => (
              <div key={tech.name} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 text-center">
                <span className="font-bold text-sm text-sky-400 block">{tech.name}</span>
                <span className="text-[11px] text-slate-400 mt-1 block">{tech.role}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-400 bg-slate-950">
        <p>© 2026 DevSight AI — AI-Powered DevOps & Code Intelligence Platform. Engineered for Production.</p>
      </footer>
    </div>
  );
};
