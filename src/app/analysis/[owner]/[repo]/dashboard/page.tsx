"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard, exportDashboardReport, DashboardMetrics, TrendData } from "@/lib/api";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend === "up" && <span className="text-emerald-500">+12%</span>}
            {trend === "down" && <span className="text-red-500">-5%</span>}
            {trend === "neutral" && <span className="text-muted-foreground">No change</span>}
            <span className="text-muted-foreground">from last scan</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    async function loadDashboard() {
      setLoading(true);
      const result = await getDashboard(resolvedParams.owner, resolvedParams.repo);
      if (cancelled) return;
      
      if (result.success) {
        setMetrics(result.metrics || null);
        setTrends(result.trends || []);
        setRecommendations(result.recommendations || []);
      } else {
        toast.error(result.error || "Failed to load dashboard");
      }
      setLoading(false);
    }
    
    loadDashboard();
    return () => { cancelled = true; };
  }, [resolvedParams.owner, resolvedParams.repo]);

  const handleExport = async (format: "pdf" | "json" | "csv") => {
    setExporting(true);
    const result = await exportDashboardReport(resolvedParams.owner, resolvedParams.repo, format);
    if (result.success && result.download_url) {
      window.open(result.download_url, "_blank");
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } else {
      toast.error(result.error || "Failed to export report");
    }
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const securityPieData = metrics
    ? [
        { name: "Critical", value: metrics.security.critical, color: "#ef4444" },
        { name: "High", value: metrics.security.high, color: "#f97316" },
        { name: "Medium", value: metrics.security.medium, color: "#eab308" },
        { name: "Low", value: metrics.security.low, color: "#22c55e" },
      ].filter((d) => d.value > 0)
    : [];

  const lintingBarData = metrics
    ? [
        { name: "Errors", value: metrics.linting.errors, fill: "#ef4444" },
        { name: "Warnings", value: metrics.linting.warnings, fill: "#eab308" },
        { name: "Info", value: metrics.linting.info, fill: "#3b82f6" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analysis overview for {repoPath}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={exporting}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={exporting}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={exporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Quality Score"
          value={metrics?.quality.overall_score ?? "N/A"}
          subtitle={`Grade: ${metrics?.quality.grade ?? "N/A"}`}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          trend="up"
        />
        <MetricCard
          title="Security Issues"
          value={metrics?.security.total_vulnerabilities ?? 0}
          subtitle={`${metrics?.security.critical ?? 0} critical`}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          trend="down"
        />
        <MetricCard
          title="Linting Issues"
          value={metrics?.linting.total_issues ?? 0}
          subtitle={`${metrics?.linting.errors ?? 0} errors`}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          }
          trend="neutral"
        />
        <MetricCard
          title="Code Duplication"
          value={`${metrics?.duplication.percentage ?? 0}%`}
          subtitle={`${metrics?.duplication.duplicate_blocks ?? 0} blocks`}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M4 16V6a2 2 0 0 1 2-2h10" />
            </svg>
          }
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Trends Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Quality Trends</CardTitle>
            <CardDescription>Analysis metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quality_score"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="Quality"
                    />
                    <Line
                      type="monotone"
                      dataKey="security_issues"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name="Security"
                    />
                    <Line
                      type="monotone"
                      dataKey="linting_issues"
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={false}
                      name="Linting"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Security Breakdown</CardTitle>
            <CardDescription>Issues by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {securityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {securityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No security issues found
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {securityPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linting and Quality Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Linting Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Linting Issues</CardTitle>
            <CardDescription>Issues by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {lintingBarData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lintingBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {lintingBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No linting issues found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
            <CardDescription>Code quality breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Maintainability</span>
                <span>{metrics?.quality.avg_maintainability ?? 0}/100</span>
              </div>
              <Progress value={metrics?.quality.avg_maintainability ?? 0} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Complexity Score</span>
                <span>{Math.max(0, 100 - (metrics?.quality.avg_complexity ?? 0) * 5)}/100</span>
              </div>
              <Progress value={Math.max(0, 100 - (metrics?.quality.avg_complexity ?? 0) * 5)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Duplication Free</span>
                <span>{100 - (metrics?.duplication.percentage ?? 0)}%</span>
              </div>
              <Progress value={100 - (metrics?.duplication.percentage ?? 0)} />
            </div>
            {metrics?.cicd && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Test Coverage</span>
                  <span>{metrics.cicd.test_coverage}%</span>
                </div>
                <Progress value={metrics.cicd.test_coverage} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actionable insights to improve code quality</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
