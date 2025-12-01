"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLintingIssues, getLintingBySeverity, LintingIssue } from "@/lib/api";
import { toast } from "sonner";

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, "error" | "warning" | "info"> = {
    error: "error",
    warning: "warning",
    info: "info",
  };
  return (
    <Badge variant={variants[severity] || "secondary"}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export default function LintingPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;

  const [issues, setIssues] = useState<LintingIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [counts, setCounts] = useState({ error: 0, warning: 0, info: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    
    async function loadIssues() {
      setLoading(true);
      const result = await getLintingIssues(resolvedParams.owner, resolvedParams.repo);
      if (cancelled) return;
      
      if (result.success) {
        setIssues(result.issues || []);
        setCounts({
          error: result.error_count || 0,
          warning: result.warning_count || 0,
          info: result.info_count || 0,
          total: result.total_count || 0,
        });
      } else {
        toast.error(result.error || "Failed to load linting issues");
      }
      setLoading(false);
    }
    
    loadIssues();
    return () => { cancelled = true; };
  }, [resolvedParams.owner, resolvedParams.repo]);

  const handleFilterChange = async (newFilter: string) => {
    setFilter(newFilter);
    setLoading(true);
    
    if (newFilter === "all") {
      const result = await getLintingIssues(resolvedParams.owner, resolvedParams.repo);
      if (result.success) {
        setIssues(result.issues || []);
      }
    } else {
      const result = await getLintingBySeverity(resolvedParams.owner, resolvedParams.repo, newFilter);
      if (result.success) {
        setIssues(result.issues || []);
      }
    }
    setLoading(false);
  };

  const groupedByFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file_path]) {
      acc[issue.file_path] = [];
    }
    acc[issue.file_path].push(issue);
    return acc;
  }, {} as Record<string, LintingIssue[]>);

  if (loading && issues.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Linting Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Code style and lint issues for {repoPath}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleFilterChange("all")}>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Issues</div>
            <div className="text-3xl font-bold mt-1">{counts.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-red-500/30" onClick={() => handleFilterChange("error")}>
          <CardContent className="p-4">
            <div className="text-sm text-red-500">Errors</div>
            <div className="text-3xl font-bold mt-1 text-red-500">{counts.error}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-yellow-500/30" onClick={() => handleFilterChange("warning")}>
          <CardContent className="p-4">
            <div className="text-sm text-yellow-500">Warnings</div>
            <div className="text-3xl font-bold mt-1 text-yellow-500">{counts.warning}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-blue-500/30" onClick={() => handleFilterChange("info")}>
          <CardContent className="p-4">
            <div className="text-sm text-blue-500">Info</div>
            <div className="text-3xl font-bold mt-1 text-blue-500">{counts.info}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={handleFilterChange}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
          <TabsTrigger value="error">Errors ({counts.error})</TabsTrigger>
          <TabsTrigger value="warning">Warnings ({counts.warning})</TabsTrigger>
          <TabsTrigger value="info">Info ({counts.info})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Issues by File</CardTitle>
          <CardDescription>
            {filter === "all" ? "All linting issues" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} issues`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : Object.keys(groupedByFile).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="font-medium">No issues found</p>
              <p className="text-sm mt-1">Your code looks clean!</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {Object.entries(groupedByFile).map(([filePath, fileIssues]) => (
                  <div key={filePath} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
                      <span className="font-mono text-sm truncate flex-1">{filePath}</span>
                      <Badge variant="secondary">{fileIssues.length} issues</Badge>
                    </div>
                    <div className="divide-y divide-border">
                      {fileIssues.map((issue) => (
                        <div key={issue.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <SeverityBadge severity={issue.severity} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{issue.message}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Line {issue.line}:{issue.column}</span>
                                <span className="font-mono">{issue.rule}</span>
                                <span>{issue.source}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
