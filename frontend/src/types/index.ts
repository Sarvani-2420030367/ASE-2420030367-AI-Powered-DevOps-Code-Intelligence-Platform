export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  repository_url?: string;
  primary_language: string;
  created_at: string;
  updated_at: string;
  health_score?: number;
  security_score?: number;
  devops_score?: number;
  file_count?: number;
  line_count?: number;
}

export interface Finding {
  id: string;
  analysis_id: string;
  type: 'QUALITY' | 'SECURITY' | 'MAINTAINABILITY' | 'ARCHITECTURE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  file_path: string;
  line_number: number;
  title: string;
  description: string;
  recommendation: string;
}

export interface Analysis {
  id: string;
  project_id: string;
  health_score: number;
  quality_score: number;
  security_score: number;
  maintainability_score: number;
  architecture_score: number;
  devops_readiness_score: number;
  devops_readiness_details: Record<string, number>;
  insights: {
    architecture_summary?: string;
    key_components?: { name: string; description: string }[];
    recommendations?: string[];
  };
  created_at: string;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface RepositoryData {
  id: string;
  project_id: string;
  file_count: number;
  line_count: number;
  languages: Record<string, { files: number; lines: number }>;
  dependencies: { name: string; version: string; type: string; manifest: string }[];
  uploaded_at: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
}

export interface Artifact {
  id: string;
  project_id: string;
  artifact_type: string;
  filename: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  sources?: { file_path: string; line_number?: number; snippet?: string }[];
  created_at: string;
}
