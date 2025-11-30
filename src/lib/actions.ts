"use server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export interface IndexRepoResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SearchResult {
  file_path: string;
  content: string;
  score: number;
  line_start?: number;
  line_end?: number;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  answer?: string;
  error?: string;
}

export async function indexRepository(
  repoUrl: string
): Promise<IndexRepoResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/index`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repo_url: repoUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || errorData.message || `Failed to index repository (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Repository indexed successfully",
    };
  } catch (error) {
    console.error("Error indexing repository:", error);
    const isConnectionError = error instanceof Error && 
      (error.cause as { code?: string })?.code === "ECONNREFUSED";
    return {
      success: false,
      error: isConnectionError 
        ? "Backend server is not running. Please start the server at localhost:8000"
        : error instanceof Error ? error.message : "Failed to connect to the server",
    };
  }
}

function extractRepoName(repoUrl: string): string {
  // Extract owner/repo from GitHub URL or direct repo path
  const githubMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  if (githubMatch) {
    return githubMatch[1].replace(/\.git$/, "").toLowerCase();
  }
  // Handle direct owner/repo format
  const directMatch = repoUrl.match(/^([^/]+\/[^/]+)\/?$/);
  if (directMatch) {
    return directMatch[1].toLowerCase();
  }
  // Try to extract from encoded URL or any path containing owner/repo
  const pathMatch = repoUrl.match(/([^/]+\/[^/]+)\/?$/);
  return pathMatch ? pathMatch[1].replace(/\.git$/, "").toLowerCase() : "";
}

export async function searchCode(
  repoUrl: string,
  query: string
): Promise<SearchResponse> {
  try {
    const targetRepo = extractRepoName(repoUrl);
    
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repo_url: repoUrl, query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || errorData.message || `Search failed (${response.status})`,
      };
    }

    const data = await response.json();
    
    // Map backend response fields to frontend interface
    const matches = data.matches || data.results || data.chunks || [];
    
    const results: SearchResult[] = matches
      .filter((match: { repo?: string }) => {
        // Filter results to only include the target repository
        if (!targetRepo) return true;
        if (!match.repo) return false;
        const matchRepo = match.repo.toLowerCase();
        return matchRepo === targetRepo || matchRepo.includes(targetRepo) || targetRepo.includes(matchRepo);
      })
      .map((match: {
        file?: string;
        file_path?: string;
        snippet?: string;
        content?: string;
        score?: number;
        start_line?: number;
        line_start?: number;
        end_line?: number;
        line_end?: number;
        language?: string;
      }) => ({
        file_path: match.file || match.file_path || "",
        content: match.snippet || match.content || "",
        score: match.score || 0,
        line_start: match.start_line || match.line_start,
        line_end: match.end_line || match.line_end,
        language: match.language,
      }));

    return {
      success: true,
      results,
      answer: data.answer || data.response || data.message,
    };
  } catch (error) {
    console.error("Error searching code:", error);
    const isConnectionError = error instanceof Error && 
      (error.cause as { code?: string })?.code === "ECONNREFUSED";
    return {
      success: false,
      error: isConnectionError 
        ? "Backend server is not running. Please start the server at localhost:8000"
        : error instanceof Error ? error.message : "Failed to connect to the server",
    };
  }
}
