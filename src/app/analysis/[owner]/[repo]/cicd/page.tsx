"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getCICDInfo, getCICDPipelines, CICDPlatform, PipelineStatus } from "@/lib/api";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-emerald-500/20 text-emerald-500",
    failed: "bg-red-500/20 text-red-500",
    running: "bg-blue-500/20 text-blue-500",
    pending: "bg-yellow-500/20 text-yellow-500",
  };
  return <Badge className={colors[status] || "bg-muted"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function PlatformIcon({ name }: { name: string }) {
  if (name.toLowerCase().includes("github")) {
    return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
  }
  return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

export default function CICDPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;

  const [platforms, setPlatforms] = useState<CICDPlatform[]>([]);
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildHealth, setBuildHealth] = useState(0);
  const [testCoverage, setTestCoverage] = useState(0);
  const [artifactCount, setArtifactCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    async function loadCICD() {
      setLoading(true);
      const [infoResult, pipelinesResult] = await Promise.all([getCICDInfo(repoPath), getCICDPipelines(repoPath)]);
      if (cancelled) return;

      if (infoResult.success) {
        setPlatforms(infoResult.platforms || []);
        setBuildHealth(infoResult.build_health || 0);
        setTestCoverage(infoResult.test_coverage || 0);
        setArtifactCount(infoResult.artifact_count || 0);
      } else {
        toast.error(infoResult.error || "Failed to load CI/CD info");
      }

      if (pipelinesResult.success) setPipelines(pipelinesResult.pipelines || []);
      setLoading(false);
    }
    
    loadCICD();
    return () => { cancelled = true; };
  }, [repoPath]);

  const detectedPlatforms = platforms.filter((p) => p.detected);
  const successfulPipelines = pipelines.filter((p) => p.status === "success").length;
  const failedPipelines = pipelines.filter((p) => p.status === "failed").length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-24" />))}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CI/CD Integration</h1>
        <p className="text-muted-foreground text-sm mt-1">Pipeline and build analysis for {repoPath}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Build Health</div><div className="text-3xl font-bold mt-1">{buildHealth}%</div><Progress value={buildHealth} className="mt-2" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Test Coverage</div><div className="text-3xl font-bold mt-1">{testCoverage}%</div><Progress value={testCoverage} className="mt-2" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Pipelines</div><div className="flex items-center gap-2 mt-1"><span className="text-2xl font-bold text-emerald-500">{successfulPipelines}</span><span>/</span><span className="text-2xl font-bold text-red-500">{failedPipelines}</span></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Artifacts</div><div className="text-3xl font-bold mt-1">{artifactCount}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Detected CI/CD Platforms</CardTitle><CardDescription>Platforms configured in this repository</CardDescription></CardHeader>
        <CardContent>
          {detectedPlatforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
              <p className="font-medium">No CI/CD platforms detected</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {detectedPlatforms.map((platform) => (
                <div key={platform.name} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="text-primary"><PlatformIcon name={platform.name} /></div>
                  <div><div className="font-medium">{platform.name}</div>{platform.config_file && <div className="text-xs text-muted-foreground font-mono">{platform.config_file}</div>}</div>
                  <Badge variant="success" className="ml-auto">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pipeline History</CardTitle><CardDescription>Recent pipeline runs</CardDescription></CardHeader>
        <CardContent>
          {pipelines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <p className="font-medium">No pipeline runs found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <StatusBadge status={pipeline.status} />
                      <div><div className="font-medium">{pipeline.name}</div><div className="text-xs text-muted-foreground">Started: {formatDate(pipeline.started_at)}</div></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatDuration(pipeline.duration_seconds)}</div>
                      {pipeline.finished_at && <div className="text-xs text-muted-foreground">Finished: {formatDate(pipeline.finished_at)}</div>}
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
