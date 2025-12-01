import { NextRequest, NextResponse } from "next/server";
import { getCICDInfo, CICDResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const repoPath = resolvedParams.repo.join("/");
    const result = await getCICDInfo(repoPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching CI/CD data:", error);
    return NextResponse.json(
      { error: "Failed to fetch CI/CD data" },
      { status: 500 }
    );
  }
}