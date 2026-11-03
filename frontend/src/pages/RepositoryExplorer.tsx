import React, { useEffect, useState } from 'react';
import { Project, FileTreeNode } from '../types';
import { api } from '../services/api';
import { FileTree } from '../components/FileTree';
import { CodeViewer } from '../components/CodeViewer';
import { FolderTree, FileCode, AlertCircle, Loader2 } from 'lucide-react';

interface RepositoryExplorerProps {
  project: Project | null;
  onExplainIssue: (finding: any) => void;
}

export const RepositoryExplorer: React.FC<RepositoryExplorerProps> = ({ project, onExplainIssue }) => {
  const [treeNodes, setTreeNodes] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileFindings, setFileFindings] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (project?.id) {
      fetchFileTree();
    }
  }, [project?.id]);

  const fetchFileTree = async () => {
    setLoadingTree(true);
    try {
      const resp = await api.get(`/api/projects/${project!.id}/repository/files`);
      setTreeNodes(resp.data);
      // Auto select first file if available
      const first = findFirstFile(resp.data);
      if (first) {
        loadFile(first);
      }
    } catch (err) {
      console.error('Failed to fetch file tree', err);
    } finally {
      setLoadingTree(false);
    }
  };

  const findFirstFile = (nodes: FileTreeNode[]): string | null => {
    for (const node of nodes) {
      if (node.type === 'file') return node.path;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const loadFile = async (path: string) => {
    setSelectedFile(path);
    setLoadingContent(true);
    try {
      const resp = await api.get(`/api/projects/${project!.id}/repository/file-content`, {
        params: { path },
      });
      setFileContent(resp.data.content);
      setFileFindings(resp.data.findings || []);
    } catch (err) {
      console.error('Failed to fetch file content', err);
      setFileContent('// Failed to load file content or file is binary');
      setFileFindings([]);
    } finally {
      setLoadingContent(false);
    }
  };

  if (!project) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <FolderTree className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Repository Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Please select an active project with analyzed repository files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Codebase Explorer</h2>
          <p className="text-xs text-slate-400">
            Browse files and inspect detected static quality and security findings inline.
          </p>
        </div>
      </div>

      {/* Explorer Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left: File Tree */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5 text-sky-400" />
              Files
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {project.primary_language}
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            {loadingTree ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
                Reading file system...
              </div>
            ) : treeNodes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No files found. Run a repository scan first.
              </div>
            ) : (
              <FileTree
                nodes={treeNodes}
                selectedPath={selectedFile}
                onSelectFile={loadFile}
              />
            )}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 flex flex-col">
          {loadingContent ? (
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
              Loading code...
            </div>
          ) : selectedFile ? (
            <CodeViewer
              fileName={selectedFile}
              content={fileContent}
              findings={fileFindings}
              onExplainIssue={onExplainIssue}
            />
          ) : (
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs p-8">
              <FileCode className="w-10 h-10 text-slate-600 mb-2" />
              <p>Select a file from the tree to view syntax and inline annotations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
