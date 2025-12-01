"use server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

// Types for Linting
export interface LintingIssue {
  id: string;
  file_path: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  source: string;
}

export interface LintingResponse {
  success: boolean;
  issues?: LintingIssue[];
  total_count?: number;
  error_count?: number;
  warning_count?: number;
  info_count?: number;
  error?: string;
}

// Types for Quality Metrics
export interface QualityMetrics {
  maintainability_index: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  halstead_volume: number;
  halstead_difficulty: number;
  code_smells: string[];
  grade: string;
}

export interface FileQualityMetrics {
  file_path: string;
  metrics: QualityMetrics;
}

export interface QualityResponse {
  success: boolean;
  overall_score?: number;
  grade?: string;
  files?: FileQualityMetrics[];
  total_files?: number;
  average_complexity?: number;
  average_maintainability?: number;
  error?: string;
}

// Types for Security Scanning
export interface SecurityVulnerability {
  id: string;
  file_path: string;
  line: number;
  severity: "critical" | "high" | "medium" | "low";
  cwe_id?: string;
  owasp_category?: string;
  title: string;
  description: string;
  recommendation?: string;
  source: string;
}

export interface DependencyVulnerability {
  package_name: string;
  current_version: string;
  vulnerable_versions: string;
  severity: "critical" | "high" | "medium" | "low";
  cve_id?: string;
  description: string;
  recommendation?: string;
}

export interface SecurityResponse {
  success: boolean;
  vulnerabilities?: SecurityVulnerability[];
  dependency_issues?: DependencyVulnerability[];
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  error?: string;
}

// Types for GitHub Integration
export interface GitHubRepoMetadata {
  name: string;
  full_name: string;
  description: string;
  stars: number;
  forks: number;
  open_issues: number;
  language: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  health_score?: number;
  contributors_count?: number;
}

export interface GitHubImportResponse {
  success: boolean;
  repo_id?: string;
  metadata?: GitHubRepoMetadata;
  message?: string;
  error?: string;
}

// Types for CI/CD
export interface CICDPlatform {
  name: string;
  detected: boolean;
  config_file?: string;
}

export interface PipelineStatus {
  id: string;
  name: string;
  status: "success" | "failed" | "running" | "pending";
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
}

export interface CICDResponse {
  success: boolean;
  platforms?: CICDPlatform[];
  pipelines?: PipelineStatus[];
  build_health?: number;
  test_coverage?: number;
  artifact_count?: number;
  error?: string;
}

// Types for Duplicate Detection
export interface DuplicateBlock {
  id: string;
  type: "exact" | "structural" | "logical" | "partial";
  similarity: number;
  locations: {
    file_path: string;
    start_line: number;
    end_line: number;
    content?: string;
  }[];
}

export interface DuplicationResponse {
  success: boolean;
  duplicates?: DuplicateBlock[];
  total_duplicates?: number;
  duplication_percentage?: number;
  duplicate_lines?: number;
  total_lines?: number;
  error?: string;
}

// Types for Dashboard
export interface DashboardMetrics {
  linting: {
    total_issues: number;
    errors: number;
    warnings: number;
    info: number;
  };
  quality: {
    overall_score: number;
    grade: string;
    avg_complexity: number;
    avg_maintainability: number;
  };
  security: {
    total_vulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  duplication: {
    percentage: number;
    duplicate_blocks: number;
    duplicate_lines: number;
  };
  cicd?: {
    build_health: number;
    test_coverage: number;
    last_build_status: string;
  };
}

export interface TrendData {
  date: string;
  quality_score: number;
  security_issues: number;
  linting_issues: number;
  duplication: number;
}

export interface DashboardResponse {
  success: boolean;
  metrics?: DashboardMetrics;
  trends?: TrendData[];
  recommendations?: string[];
  error?: string;
}

// API Functions

export async function getLintingIssues(repoId: string): Promise<LintingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/linting/${encodeURIComponent(repoId)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch linting data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getLintingBySeverity(repoId: string, severity: string): Promise<LintingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/linting/${encodeURIComponent(repoId)}/severity/${severity}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch linting data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getQualityMetrics(repoId: string): Promise<QualityResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quality/${encodeURIComponent(repoId)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch quality data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getComplexityMetrics(repoId: string): Promise<QualityResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quality/${encodeURIComponent(repoId)}/complexity`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch complexity data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getSecurityScan(repoId: string): Promise<SecurityResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/security/${encodeURIComponent(repoId)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch security data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getSecurityBySeverity(repoId: string, severity: string): Promise<SecurityResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/security/${encodeURIComponent(repoId)}/severity/${severity}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch security data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function importGitHubRepo(repoUrl: string): Promise<GitHubImportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/github/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to import repository (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getGitHubMetadata(repoId: string): Promise<{ success: boolean; metadata?: GitHubRepoMetadata; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/github/${encodeURIComponent(repoId)}/metadata`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch metadata (${response.status})` };
    }
    const data = await response.json();
    return { success: true, metadata: data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getCICDInfo(repoId: string): Promise<CICDResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cicd/${encodeURIComponent(repoId)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch CI/CD data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getCICDPipelines(repoId: string): Promise<CICDResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cicd/${encodeURIComponent(repoId)}/pipelines`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch pipelines (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getDuplicationAnalysis(repoId: string): Promise<DuplicationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/duplication/${encodeURIComponent(repoId)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch duplication data (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function triggerDuplicationScan(repoId: string): Promise<DuplicationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/duplication/${encodeURIComponent(repoId)}/scan`, {
      method: "POST",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to trigger scan (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getDashboard(repoId: string): Promise<DashboardResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/${encodeURIComponent(repoId)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch dashboard (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function getDashboardTrends(repoId: string): Promise<DashboardResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/${encodeURIComponent(repoId)}/trends`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to fetch trends (${response.status})` };
    }
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}

export async function exportDashboardReport(
  repoId: string,
  format: "pdf" | "json" | "csv"
): Promise<{ success: boolean; download_url?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/${encodeURIComponent(repoId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.detail || `Failed to export report (${response.status})` };
    }
    const data = await response.json();
    return { success: true, download_url: data.download_url };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to connect to server" };
  }
}
