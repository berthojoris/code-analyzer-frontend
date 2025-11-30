import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      {/* Messages Area Skeleton */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="space-y-2 text-center">
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Skeleton className="flex-1 h-11" />
          <Skeleton className="h-11 w-11" />
        </div>
      </div>
    </div>
  );
}
