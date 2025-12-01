import { NextRequest, NextResponse } from "next/server";
import { getCICDPipelines, CICDResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const repoPath = resolvedParams.repo.join("/");
    const result = await getCICDPipelines(repoPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching CI/CD pipelines:", error);
    return NextResponse.json(
      { error: "Failed to fetch CI/CD pipelines" },
      { status: 500 }
    );
  }
}