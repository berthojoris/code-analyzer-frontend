import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Hero Section Skeleton */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Skeleton className="w-16 h-16 rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-64 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-80 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>

        {/* Features Skeleton */}
        <div className="flex justify-center gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}
