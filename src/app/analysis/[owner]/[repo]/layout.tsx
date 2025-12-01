"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnalysisNav } from "@/components/analysis/analysis-nav";

export default function AnalysisLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ owner: string; repo: string }>;
}) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;
  const router = useRouter();

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-56 border-r border-border bg-card flex flex-col">
        {/* Repo Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push("/")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="min-w-0 flex-1">
              <Link href={`/chat/${repoPath}`} className="text-sm font-medium truncate block hover:text-primary">
                {repoPath}
              </Link>
              <p className="text-xs text-muted-foreground">Analysis</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <AnalysisNav repoPath={repoPath} />
        </div>

        {/* Chat Link */}
        <div className="p-2 border-t border-border">
          <Link
            href={`/chat/${repoPath}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Back to Chat
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
}
