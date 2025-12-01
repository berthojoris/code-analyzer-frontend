"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getQualityMetrics, FileQualityMetrics } from "@/lib/api";
import { toast } from "sonner";

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-emerald-500/20 text-emerald-500",
    B: "bg-green-500/20 text-green-500",
    C: "bg-yellow-500/20 text-yellow-500",
    D: "bg-orange-500/20 text-orange-500",
    F: "bg-red-500/20 text-red-500",
  };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${colors[grade] || colors.C}`}>
      {grade}
    </span>
  );
}

function MetricBar({ label, value, max = 100, inverse = false }: { label: string; value: number; max?: number; inverse?: boolean }) {
  const percentage = inverse ? Math.max(0, 100 - (value / max) * 100) : Math.min(100, (value / max) * 100);
  const color = percentage > 70 ? "bg-emerald-500" : percentage > 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function QualityPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;

  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [grade, setGrade] = useState("N/A");
  const [files, setFiles] = useState<FileQualityMetrics[]>([]);
  const [avgComplexity, setAvgComplexity] = useState(0);
  const [avgMaintainability, setAvgMaintainability] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    async function loadQuality() {
      setLoading(true);
      const result = await getQualityMetrics(resolvedParams.owner, resolvedParams.repo);
      if (cancelled) return;
      
      if (result.success) {
        setOverallScore(result.overall_score || 0);
        setGrade(result.grade || "N/A");
        setFiles(result.files || []);
        setAvgComplexity(result.average_complexity || 0);
        setAvgMaintainability(result.average_maintainability || 0);
      } else {
        toast.error(result.error || "Failed to load quality metrics");
      }
      setLoading(false);
    }
    
    loadQuality();
    return () => { cancelled = true; };
  }, [resolvedParams.owner, resolvedParams.repo]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-32" />))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Code Quality</h1>
        <p className="text-muted-foreground text-sm mt-1">Maintainability and complexity metrics for {repoPath}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold">{overallScore.toFixed(0)}</div>
            <div className="text-muted-foreground mt-2">Quality Score</div>
            <div className="mt-4"><GradeBadge grade={grade} /></div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Averages</CardTitle>
            <CardDescription>Repository-wide metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <MetricBar label="Maintainability Index" value={avgMaintainability} max={100} />
            <MetricBar label="Cyclomatic Complexity" value={avgComplexity} max={20} inverse />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{files.length}</div>
                <div className="text-sm text-muted-foreground">Files Analyzed</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{files.filter((f) => f.metrics.code_smells.length > 0).length}</div>
                <div className="text-sm text-muted-foreground">Files with Smells</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Files Analysis</CardTitle>
          <CardDescription>Quality metrics per file</CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="font-medium">No files analyzed</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.file_path} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm truncate flex-1">{file.file_path}</span>
                      <GradeBadge grade={file.metrics.grade} />
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div><div className="text-muted-foreground">Maintainability</div><div className="font-medium">{file.metrics.maintainability_index.toFixed(1)}</div></div>
                      <div><div className="text-muted-foreground">Cyclomatic</div><div className="font-medium">{file.metrics.cyclomatic_complexity.toFixed(1)}</div></div>
                      <div><div className="text-muted-foreground">Cognitive</div><div className="font-medium">{file.metrics.cognitive_complexity.toFixed(1)}</div></div>
                      <div><div className="text-muted-foreground">Halstead Vol.</div><div className="font-medium">{file.metrics.halstead_volume.toFixed(0)}</div></div>
                    </div>
                    {file.metrics.code_smells.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {file.metrics.code_smells.map((smell, idx) => (<Badge key={idx} variant="warning">{smell}</Badge>))}
                      </div>
                    )}
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
