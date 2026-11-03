
import React, { useState, useEffect } from 'react';
import { User, Project, Analysis, Finding, RepositoryData } from './types';
import { api } from './services/api';

// Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { RepositoryAnalysis } from './pages/RepositoryAnalysis';
import { RepositoryExplorer } from './pages/RepositoryExplorer';
import { CodeQuality } from './pages/CodeQuality';
import { Security } from './pages/Security';
import { AIAssistant } from './pages/AIAssistant';
import { DeploymentGenerator } from './pages/DeploymentGenerator';
import { CICDGenerator } from './pages/CICDGenerator';
import { KubernetesGenerator } from './pages/KubernetesGenerator';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('devsight_token')
  );

  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [repository, setRepository] = useState<RepositoryData | null>(null);

  const [aiQuery, setAiQuery] = useState<string>('');

  // Theme state: Dark mode is the default
  const [isLightMode, setIsLightMode] = useState<boolean>(
    localStorage.getItem('devsight_theme') === 'light'
  );

  // Apply and save the selected theme
  useEffect(() => {
    const theme = isLightMode ? 'light' : 'dark';

    document.documentElement.classList.toggle('light', isLightMode);
    document.documentElement.classList.toggle('dark', !isLightMode);

    localStorage.setItem('devsight_theme', theme);
  }, [isLightMode]);

  // Initial user check
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // When user is authenticated, fetch projects
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // When active project changes, fetch its analysis and findings
  useEffect(() => {
    if (activeProject?.id) {
      fetchProjectAnalysis(activeProject.id);
      fetchProjectRepository(activeProject.id);
    }
  }, [activeProject?.id]);

  const fetchCurrentUser = async () => {
    try {
      const resp = await api.get('/api/auth/me');
      setUser(resp.data);
      setView('app');
    } catch {
      localStorage.removeItem('devsight_token');
      setToken(null);
      setUser(null);
    }
  };

  const fetchProjects = async () => {
    try {
      const resp = await api.get('/api/projects');
      setProjects(resp.data);

      // Select the first existing project, but never automatically load demo data.
      if (resp.data.length > 0 && !activeProject) {
        setActiveProject(resp.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchProjectAnalysis = async (projectId: string) => {
    try {
      const [analysisResp, findingsResp] = await Promise.all([
        api.get(`/api/projects/${projectId}/analysis`),
        api.get(`/api/projects/${projectId}/findings`),
      ]);

      setAnalysis(analysisResp.data);
      setFindings(findingsResp.data);
    } catch (err) {
      console.error('Failed to fetch project analysis:', err);
      setAnalysis(null);
      setFindings([]);
    }
  };

  const fetchProjectRepository = async (projectId: string) => {
    try {
      const resp = await api.get(`/api/projects/${projectId}/repository`);
      setRepository(resp.data);
    } catch (err) {
      console.error('Failed to fetch repository:', err);
      setRepository(null);
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setView('app');
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('devsight_token');
    setToken(null);
    setUser(null);
    setView('landing');
  };

  const handleLoadDemo = async () => {
    try {
      // Auto-authenticate with demo credentials if not logged in
      if (!token) {
        try {
          const authResp = await api.post('/api/auth/login', {
            email: 'demo@devsight.ai',
            password: 'DevSightDemo2026!',
          });

          localStorage.setItem('devsight_token', authResp.data.access_token);
          setToken(authResp.data.access_token);
          setUser(authResp.data.user);
        } catch {
          // If demo user not yet registered, register it
          const regResp = await api.post('/api/auth/register', {
            name: 'Demo Engineer',
            email: 'demo@devsight.ai',
            password: 'DevSightDemo2026!',
          });

          localStorage.setItem('devsight_token', regResp.data.access_token);
          setToken(regResp.data.access_token);
          setUser(regResp.data.user);
        }
      }

      const resp = await api.post('/api/projects/demo');
      setActiveProject(resp.data);
      await fetchProjects();
      setView('app');
      setCurrentTab('dashboard');
    } catch (err) {
      console.error('Failed to load demo project', err);
    }
  };

  const handleExplainInAI = (finding: any) => {
    setAiQuery(
      `Explain this ${finding.severity} ${finding.type} issue in ${finding.file || finding.file_path} at line ${finding.line || finding.line_number}: "${finding.title}". How can I safely refactor it?`
    );

    setCurrentTab('ai-assistant');
  };

  const handleOpenFile = (file: string, line?: number) => {
    setCurrentTab('explorer');
  };

  // Route Views: Landing, Login, Register
  if (view === 'landing') {
    return (
      <Landing
        onStartAnalysis={() => {
          if (user) {
            setView('app');
            setCurrentTab('repository-analysis');
          } else {
            setView('login');
          }
        }}
        onViewDemo={handleLoadDemo}
        onLogin={() => setView('login')}
        onRegister={() => setView('register')}
      />
    );
  }

  if (view === 'login') {
    return (
      <Login
        onSuccess={handleAuthSuccess}
        onGoToRegister={() => setView('register')}
        onGoToLanding={() => setView('landing')}
      />
    );
  }

  if (view === 'register') {
    return (
      <Register
        onSuccess={handleAuthSuccess}
        onGoToLogin={() => setView('login')}
        onGoToLanding={() => setView('landing')}
      />
    );
  }

  // Authenticated App Shell
  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        isLightMode
          ? 'bg-slate-50 text-slate-900'
          : 'bg-[#080c14] text-slate-100'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        projectName={activeProject?.name}
        primaryLanguage={activeProject?.primary_language}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        <Navbar
          projects={projects}
          activeProject={activeProject}
          onSelectProject={(p) => setActiveProject(p)}
          onLoadDemo={handleLoadDemo}
          userName={user?.name}
          onLogout={handleLogout}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode((prev) => !prev)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              project={activeProject}
              analysis={analysis}
              repository={repository}
              onNavigateTab={setCurrentTab}
              onReanalyze={() => {
                if (activeProject) {
                  fetchProjectAnalysis(activeProject.id);
                }
              }}
            />
          )}

          {currentTab === 'projects' && (
            <Projects
              projects={projects}
              activeProjectId={activeProject?.id || null}
              onSelectProject={(p) => {
                setActiveProject(p);
                setCurrentTab('dashboard');
              }}
              onLoadDemo={handleLoadDemo}
              onRefreshProjects={fetchProjects}
            />
          )}

          {currentTab === 'repository-analysis' && (
            <RepositoryAnalysis
              project={activeProject}
              onAnalysisSuccess={async () => {
                if (activeProject) {
                  await Promise.all([
                    fetchProjectAnalysis(activeProject.id),
                    fetchProjectRepository(activeProject.id),
                  ]);
                }

                setCurrentTab('dashboard');
              }}
              onLoadDemo={handleLoadDemo}
            />
          )}

          {currentTab === 'explorer' && (
            <RepositoryExplorer
              project={activeProject}
              onExplainIssue={handleExplainInAI}
            />
          )}

          {currentTab === 'code-quality' && (
            <CodeQuality
              findings={findings}
              project={activeProject}
              onExplainInAI={handleExplainInAI}
              onOpenFile={handleOpenFile}
            />
          )}

          {currentTab === 'security' && (
            <Security
              findings={findings}
              project={activeProject}
              analysis={analysis}
              onExplainInAI={handleExplainInAI}
              onOpenFile={handleOpenFile}
            />
          )}

          {currentTab === 'ai-assistant' && (
            <AIAssistant
              project={activeProject}
              initialQuery={aiQuery}
              onOpenFile={handleOpenFile}
            />
          )}

          {currentTab === 'deployment' && (
            <DeploymentGenerator project={activeProject} />
          )}

          {currentTab === 'cicd' && (
            <CICDGenerator project={activeProject} />
          )}

          {currentTab === 'kubernetes' && (
            <KubernetesGenerator project={activeProject} />
          )}

          {currentTab === 'settings' && (
            <Settings user={user} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
