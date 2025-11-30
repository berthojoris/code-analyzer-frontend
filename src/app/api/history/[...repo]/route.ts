import { NextRequest, NextResponse } from "next/server";
import { getChatHistory, saveChatHistory, ChatMessage, SearchResultData } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const repoPath = resolvedParams.repo.join("/");
    const history = getChatHistory(repoPath);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
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
    const body = await request.json();
    
    const { messages, openedFiles } = body as {
      messages: ChatMessage[];
      openedFiles: SearchResultData[];
    };
    
    saveChatHistory(repoPath, messages, openedFiles);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving chat history:", error);
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 }
    );
  }
}
