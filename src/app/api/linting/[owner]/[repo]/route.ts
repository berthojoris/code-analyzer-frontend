import { NextRequest, NextResponse } from "next/server";
import { getLintingIssues, LintingResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const resolvedParams = await params;
    const result = await getLintingIssues(resolvedParams.owner, resolvedParams.repo);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching linting data:", error);
    return NextResponse.json(
      { error: "Failed to fetch linting data" },
      { status: 500 }
    );
  }
}