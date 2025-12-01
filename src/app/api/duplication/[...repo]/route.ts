import { NextRequest, NextResponse } from "next/server";
import { getDuplicationAnalysis, triggerDuplicationScan, DuplicationResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const repoPath = resolvedParams.repo.join("/");
    const result = await getDuplicationAnalysis(repoPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching duplication analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch duplication analysis" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const repoPath = resolvedParams.repo.join("/");
    const result = await triggerDuplicationScan(repoPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error triggering duplication scan:", error);
    return NextResponse.json(
      { error: "Failed to trigger duplication scan" },
      { status: 500 }
    );
  }
}