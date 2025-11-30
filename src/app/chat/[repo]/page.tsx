"use client";

import { useState, useTransition, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { searchCode, SearchResult } from "@/lib/actions";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  type: "question" | "answer";
  content: string;
  results?: SearchResult[];
  timestamp: Date;
}

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    md: "markdown",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    dockerfile: "dockerfile",
  };
  return langMap[ext] || "plaintext";
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

function MarkdownContent({ content }: { content: string }) {
  const { theme } = useTheme();
  const mounted = useMounted();
  const codeStyle = mounted && theme === "light" ? vs : vscDarkPlus;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !String(children).includes("\n");
          
          if (isInline) {
            return (
              <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="my-2 rounded overflow-hidden border border-border/50">
              <SyntaxHighlighter
                style={codeStyle}
                language={match ? match[1] : "plaintext"}
                PreTag="div"
                customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px", padding: "8px" }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0 text-[13px] leading-relaxed break-words whitespace-pre-wrap">{children}</p>;
        },
        ul({ children }) {
          return <ul className="mb-2 ml-4 list-disc space-y-0.5 text-[13px]">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-[13px]">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed break-words">{children}</li>;
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const resolvedParams = use(params);
  const repoUrl = decodeURIComponent(resolvedParams.repo);
  const repoName = repoUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [codeResults, setCodeResults] = useState<SearchResult[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const mounted = useMounted();

  const codeStyle = mounted && theme === "light" ? vs : vscDarkPlus;

  const handleCloseTab = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newResults = codeResults.filter((_, i) => i !== index);
    setCodeResults(newResults);
    if (activeTab >= newResults.length) {
      setActiveTab(Math.max(0, newResults.length - 1));
    } else if (activeTab > index) {
      setActiveTab(activeTab - 1);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isPending]);

  const deduplicateResults = (results: SearchResult[]): SearchResult[] => {
    return results.reduce((acc, current) => {
      const existing = acc.find(item => item.file_path === current.file_path);
      if (!existing) {
        acc.push(current);
      } else if ((current.score || 0) > (existing.score || 0)) {
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
      return acc;
    }, [] as SearchResult[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const questionId = Date.now().toString();
    const questionMessage: Message = {
      id: questionId,
      type: "question",
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, questionMessage]);
    setQuery("");

    startTransition(async () => {
      const result = await searchCode(repoUrl, query.trim());
      const answerId = (Date.now() + 1).toString();
      
      if (result.success) {
        const answerMessage: Message = {
          id: answerId,
          type: "answer",
          content: result.answer || "Here are the relevant code snippets:",
          results: result.results,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, answerMessage]);
        if (result.results && result.results.length > 0) {
          setCodeResults(deduplicateResults(result.results));
          setActiveTab(0);
        }
      } else {
        toast.error(result.error || "Search failed");
        const errorMessage: Message = {
          id: answerId,
          type: "answer",
          content: result.error || "An error occurred while searching.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    });

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const activeCode = codeResults[activeTab];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#1e1e1e]">
      {/* Left Panel - Code Viewer (70%) */}
      <div className="w-[70%] flex flex-col border-r border-[#3c3c3c] bg-[#1e1e1e]">
        {/* File Tabs */}
        <div className="flex items-center bg-[#1e1e1e] border-b border-[#3c3c3c] overflow-x-auto">
          {codeResults.length > 0 ? (
            codeResults.map((result, index) => (
              <div
                key={index}
                onClick={() => setActiveTab(index)}
                className={`group flex items-center gap-2 px-3 py-2 text-sm border-r border-[#3c3c3c] transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === index
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]"
                    : "bg-[#2d2d2d] text-[#969696] hover:text-white hover:bg-[#2d2d2d]/80"
                }`}
              >
                <svg className="w-4 h-4 text-[#519aba] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.086.567.327.733.663.753-.486.753-.486 1.279-.813-.195-.303-.297-.437-.429-.564-.468-.532-1.094-.824-2.111-.787l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.608 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.543.069-1.216zm-6.737-5.434h-1.686c0 1.453-.007 2.898-.007 4.354 0 .924.047 1.772-.104 2.033-.247.517-.886.451-1.175.359-.297-.146-.448-.349-.623-.641-.047-.078-.082-.146-.095-.146l-1.368.844c.229.473.563.879.994 1.137.641.383 1.502.507 2.404.305.588-.17 1.095-.519 1.358-1.059.384-.697.302-1.553.299-2.509.008-1.541 0-3.083 0-4.635l.003-.042z"/>
                </svg>
                <span className="max-w-[120px] truncate">{getFileName(result.file_path)}</span>
                {result.score !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#007acc]/20 text-[#007acc]">
                    {(result.score * 100).toFixed(0)}%
                  </span>
                )}
                <button
                  onClick={(e) => handleCloseTab(index, e)}
                  className={`ml-1 p-0.5 rounded hover:bg-[#3c3c3c] transition-colors ${
                    activeTab === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label="Close tab"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-[#969696]">No files open</div>
          )}
        </div>

        {/* Breadcrumb */}
        {activeCode && (
          <div className="px-4 py-1.5 text-xs text-[#969696] bg-[#252526] border-b border-[#3c3c3c] font-mono flex items-center">
            {activeCode.file_path.split(/[/\\]/).map((part, i, arr) => (
              <span key={i} className="flex items-center">
                <span className="hover:text-white cursor-pointer">{part}</span>
                {i < arr.length - 1 && (
                  <svg className="w-4 h-4 mx-0.5 text-[#606060]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </span>
            ))}
            {activeCode.line_start && (
              <span className="ml-2 text-[#007acc]">Ln {activeCode.line_start}</span>
            )}
          </div>
        )}

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#1e1e1e]">
          {activeCode ? (
            <SyntaxHighlighter
              language={activeCode.language || getLanguageFromPath(activeCode.file_path)}
              style={codeStyle}
              showLineNumbers
              startingLineNumber={activeCode.line_start || 1}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: "14px",
                minHeight: "100%",
                background: "#1e1e1e",
                padding: "12px 0",
              }}
              lineNumberStyle={{
                minWidth: "4em",
                paddingRight: "1.5em",
                paddingLeft: "1em",
                color: "#858585",
                userSelect: "none",
              }}
              codeTagProps={{
                style: {
                  fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                  lineHeight: "1.6",
                },
              }}
            >
              {activeCode.content}
            </SyntaxHighlighter>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#969696]">
              <svg className="w-20 h-20 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <p className="text-sm font-medium">No file selected</p>
              <p className="text-xs mt-1 text-[#606060]">Ask a question to view related code</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat (30%) */}
      <div className="w-[30%] flex flex-col bg-[#252526]">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c] bg-[#2d2d2d]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#858585] hover:text-white hover:bg-[#3c3c3c]"
              onClick={() => router.push("/")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h2 className="text-sm font-medium truncate max-w-[200px] text-white">{repoName}</h2>
              <p className="text-[10px] text-[#858585]">Code Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#858585] hover:text-white hover:bg-[#3c3c3c]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="p-4 space-y-4 overflow-hidden">
            {messages.length === 0 && !isPending && (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#007acc]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#007acc]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">Start exploring</p>
                <p className="text-xs text-[#858585] mt-1">Ask about the codebase</p>
                <div className="mt-4 space-y-2">
                  {[
                    "What's the main entry point?",
                    "Show authentication logic",
                    "List database models",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuery(suggestion)}
                      className="block w-full text-left px-3 py-2 text-xs text-[#cccccc] rounded-lg border border-[#3c3c3c] hover:bg-[#3c3c3c] hover:text-white transition-colors break-words"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2">
                {message.type === "question" ? (
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#007acc]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#007acc]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 bg-[#3c3c3c] rounded-lg px-3 py-2">
                      <p className="text-[13px] text-white break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#4ec9b0]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#4ec9b0]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-[#cccccc] break-words">
                      <MarkdownContent content={message.content} />
                      {message.results && message.results.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.results.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const dedupedResults = deduplicateResults(message.results || []);
                                setCodeResults(dedupedResults);
                                const newIdx = dedupedResults.findIndex(r => r.file_path === result.file_path);
                                setActiveTab(newIdx >= 0 ? newIdx : 0);
                              }}
                              className="text-[10px] px-2 py-1 rounded bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] transition-colors font-mono truncate max-w-[150px]"
                              title={result.file_path}
                            >
                              {getFileName(result.file_path)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-[#4ec9b0]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#4ec9b0] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4 bg-[#3c3c3c]" />
                  <Skeleton className="h-3 w-1/2 bg-[#3c3c3c]" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3 border-t border-[#3c3c3c] bg-[#1e1e1e]">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-[#3c3c3c] rounded-lg border border-[#4c4c4c] px-3 py-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask about the code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isPending}
                className="flex-1 border-0 bg-transparent h-8 text-sm text-white placeholder:text-[#858585] focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
              <Button
                type="submit"
                disabled={isPending || !query.trim()}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-[#858585] hover:text-white hover:bg-[#4c4c4c]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              </Button>
            </div>
            <p className="text-[10px] text-[#606060] mt-2 text-center">
              AI-powered code analysis
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
