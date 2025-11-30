import { NextRequest, NextResponse } from "next/server";
import { getAllSessions, deleteSession } from "@/lib/db";

export async function GET() {
  try {
    const sessions = getAllSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoPath = searchParams.get("repo");
    
    if (!repoPath) {
      return NextResponse.json(
        { error: "Missing repo parameter" },
        { status: 400 }
      );
    }
    
    deleteSession(repoPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
