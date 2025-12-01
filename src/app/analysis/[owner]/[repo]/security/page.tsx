"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSecurityScan, getSecurityBySeverity, SecurityVulnerability, DependencyVulnerability } from "@/lib/api";
import { toast } from "sonner";

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-600/20 text-red-500 border-red-600/30",
    high: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };
  return <Badge className={colors[severity] || ""}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Badge>;
}

export default function SecurityPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;

  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [dependencies, setDependencies] = useState<DependencyVulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setFilter] = useState("all");
  const [counts, setCounts] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [activeTab, setActiveTab] = useState("code");

  useEffect(() => {
    let cancelled = false;
    
    async function loadSecurity() {
      setLoading(true);
      const result = await getSecurityScan(repoPath);
      if (cancelled) return;
      
      if (result.success) {
        setVulnerabilities(result.vulnerabilities || []);
        setDependencies(result.dependency_issues || []);
        setCounts({
          critical: result.critical_count || 0,
          high: result.high_count || 0,
          medium: result.medium_count || 0,
          low: result.low_count || 0,
        });
      } else {
        toast.error(result.error || "Failed to load security scan");
      }
      setLoading(false);
    }
    
    loadSecurity();
    return () => { cancelled = true; };
  }, [repoPath]);

  const handleFilterChange = async (newFilter: string) => {
    setFilter(newFilter);
    setLoading(true);
    
    if (newFilter === "all") {
      const result = await getSecurityScan(repoPath);
      if (result.success) setVulnerabilities(result.vulnerabilities || []);
    } else {
      const result = await getSecurityBySeverity(repoPath, newFilter);
      if (result.success) setVulnerabilities(result.vulnerabilities || []);
    }
    setLoading(false);
  };

  const totalVulnerabilities = counts.critical + counts.high + counts.medium + counts.low;

  if (loading && vulnerabilities.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-24" />))}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">Vulnerability detection for {repoPath}</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleFilterChange("all")}>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-3xl font-bold mt-1">{totalVulnerabilities}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-red-600/30" onClick={() => handleFilterChange("critical")}>
          <CardContent className="p-4">
            <div className="text-sm text-red-500">Critical</div>
            <div className="text-3xl font-bold mt-1 text-red-500">{counts.critical}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-orange-500/30" onClick={() => handleFilterChange("high")}>
          <CardContent className="p-4">
            <div className="text-sm text-orange-500">High</div>
            <div className="text-3xl font-bold mt-1 text-orange-500">{counts.high}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-yellow-500/30" onClick={() => handleFilterChange("medium")}>
          <CardContent className="p-4">
            <div className="text-sm text-yellow-500">Medium</div>
            <div className="text-3xl font-bold mt-1 text-yellow-500">{counts.medium}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-blue-500/30" onClick={() => handleFilterChange("low")}>
          <CardContent className="p-4">
            <div className="text-sm text-blue-500">Low</div>
            <div className="text-3xl font-bold mt-1 text-blue-500">{counts.low}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="code">Code Vulnerabilities ({vulnerabilities.length})</TabsTrigger>
          <TabsTrigger value="dependencies">Dependency Issues ({dependencies.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "code" && (
        <Card>
          <CardHeader>
            <CardTitle>Code Vulnerabilities</CardTitle>
            <CardDescription>Security issues found in source code</CardDescription>
          </CardHeader>
          <CardContent>
            {vulnerabilities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="font-medium">No vulnerabilities found</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="border border-border rounded-lg p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <SeverityBadge severity={vuln.severity} />
                        {vuln.cwe_id && <Badge variant="outline">{vuln.cwe_id}</Badge>}
                        {vuln.owasp_category && <Badge variant="secondary">{vuln.owasp_category}</Badge>}
                      </div>
                      <h4 className="font-medium">{vuln.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{vuln.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">{vuln.file_path}:{vuln.line}</span>
                        <span>{vuln.source}</span>
                      </div>
                      {vuln.recommendation && (
                        <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm">
                          <span className="font-medium">Recommendation: </span>{vuln.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "dependencies" && (
        <Card>
          <CardHeader>
            <CardTitle>Dependency Vulnerabilities</CardTitle>
            <CardDescription>Security issues in project dependencies</CardDescription>
          </CardHeader>
          <CardContent>
            {dependencies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <p className="font-medium">No dependency issues</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {dependencies.map((dep, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <SeverityBadge severity={dep.severity} />
                        {dep.cve_id && <Badge variant="outline">{dep.cve_id}</Badge>}
                      </div>
                      <h4 className="font-medium font-mono">{dep.package_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{dep.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-red-500">Current: {dep.current_version}</span>
                        <span className="text-muted-foreground">Vulnerable: {dep.vulnerable_versions}</span>
                      </div>
                      {dep.recommendation && (
                        <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm">
                          <span className="font-medium">Recommendation: </span>{dep.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
