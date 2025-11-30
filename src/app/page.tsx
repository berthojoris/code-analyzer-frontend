"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { indexRepository } from "@/lib/actions";
import { toast } from "sonner";

const GITHUB_REPO_REGEX = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setError("Please enter a GitHub repository URL");
      return false;
    }
    if (!GITHUB_REPO_REGEX.test(url.trim())) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(repoUrl)) {
      return;
    }

    startTransition(async () => {
      const result = await indexRepository(repoUrl.trim());
      
      if (result.success) {
        toast.success("Repository indexed successfully!");
        // Encode the repo URL for the route
        const encodedRepo = encodeURIComponent(repoUrl.trim());
        router.push(`/chat/${encodedRepo}`);
      } else {
        toast.error(result.error || "Failed to index repository");
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GitHubIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Code Analyzer
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Analyze any GitHub repository with natural language queries. 
            Get instant answers about code structure and implementation.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="url"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={handleInputChange}
                disabled={isPending}
                className={`h-12 pl-4 pr-4 text-base ${
                  error ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                aria-label="GitHub repository URL"
                aria-invalid={!!error}
                aria-describedby={error ? "url-error" : undefined}
              />
            </div>
            {error && (
              <p
                id="url-error"
                className="text-sm text-destructive animate-in fade-in slide-in-from-top-1"
              >
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isPending ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Repository...
              </>
            ) : (
              "Analyze Repo"
            )}
          </Button>
        </form>

        {/* Features Hint */}
        <div className="pt-4">
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Code Search
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Natural Language
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Syntax Highlighting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
