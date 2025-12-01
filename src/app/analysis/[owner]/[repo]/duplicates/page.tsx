"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getDuplicationAnalysis, triggerDuplicationScan, DuplicateBlock } from "@/lib/api";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

void Progress;

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    exact: "bg-red-500/20 text-red-500",
    structural: "bg-orange-500/20 text-orange-500",
    logical: "bg-yellow-500/20 text-yellow-500",
    partial: "bg-blue-500/20 text-blue-500",
  };
  return <Badge className={colors[type] || "bg-muted"}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
}

export default function DuplicatesPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;

  const [duplicates, setDuplicates] = useState<DuplicateBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ percentage: 0, duplicateLines: 0, totalLines: 0, totalDuplicates: 0 });
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      setLoading(true);
      const result = await getDuplicationAnalysis(repoPath);
      if (cancelled) return;
      
      if (result.success) {
        setDuplicates(result.duplicates || []);
        setStats({
          percentage: result.duplication_percentage || 0,
          duplicateLines: result.duplicate_lines || 0,
          totalLines: result.total_lines || 0,
          totalDuplicates: result.total_duplicates || 0,
        });
      } else {
        toast.error(result.error || "Failed to load duplication analysis");
      }
      setLoading(false);
    }
    
    fetchData();
    return () => { cancelled = true; };
  }, [repoPath, refreshTrigger]);

  async function handleScan() {
    setScanning(true);
    const result = await triggerDuplicationScan(repoPath);
    if (result.success) {
      toast.success("Duplication scan completed");
      setRefreshTrigger((prev) => prev + 1);
    } else {
      toast.error(result.error || "Failed to run scan");
    }
    setScanning(false);
  }

  const duplicatesByType = duplicates.reduce((acc, dup) => {
    acc[dup.type] = (acc[dup.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-24" />))}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duplicate Detection</h1>
          <p className="text-muted-foreground text-sm mt-1">Code duplication analysis for {repoPath}</p>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? (
            <><svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Scanning...</>
          ) : "Run New Scan"}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Duplication</div><div className="text-3xl font-bold mt-1">{stats.percentage.toFixed(1)}%</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Duplicate Blocks</div><div className="text-3xl font-bold mt-1">{stats.totalDuplicates}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Duplicate Lines</div><div className="text-3xl font-bold mt-1">{stats.duplicateLines}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Lines</div><div className="text-3xl font-bold mt-1">{stats.totalLines}</div></CardContent></Card>
      </div>

      {Object.keys(duplicatesByType).length > 0 && (
        <div className="flex flex-wrap gap-4">
          {Object.entries(duplicatesByType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2"><TypeBadge type={type} /><span className="text-sm text-muted-foreground">{count} blocks</span></div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Code Blocks</CardTitle>
          <CardDescription>Click on a block to view the code</CardDescription>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" />
              </svg>
              <p className="font-medium">No duplicates found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === dup.id ? null : dup.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <TypeBadge type={dup.type} />
                        <span className="text-sm">{dup.locations.length} occurrences</span>
                        <Badge variant="secondary">{(dup.similarity * 100).toFixed(0)}% similar</Badge>
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${expandedBlock === dup.id ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedBlock === dup.id && (
                      <div className="border-t border-border">
                        {dup.locations.map((loc, idx) => (
                          <div key={idx} className="border-b border-border last:border-b-0">
                            <div className="bg-muted/30 px-4 py-2 text-sm flex items-center justify-between">
                              <span className="font-mono truncate">{loc.file_path}</span>
                              <span className="text-muted-foreground">Lines {loc.start_line} - {loc.end_line}</span>
                            </div>
                            {loc.content && (
                              <SyntaxHighlighter language="javascript" style={vscDarkPlus} showLineNumbers startingLineNumber={loc.start_line}
                                customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px", maxHeight: "200px" }}>
                                {loc.content}
                              </SyntaxHighlighter>
                            )}
                          </div>
                        ))}
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
