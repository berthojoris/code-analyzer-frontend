"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const resolvedParams = use(params);
  const repoPath = `${resolvedParams.owner}/${resolvedParams.repo}`;
  const router = useRouter();

  useEffect(() => {
    router.replace(`/analysis/${repoPath}/dashboard`);
  }, [repoPath, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
