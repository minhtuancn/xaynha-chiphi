import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <CardSkeleton />
    </div>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card className="shadow-sm overflow-hidden" aria-hidden="true">
      <div className="p-4">
        <Skeleton className="h-10 w-72 mb-4" />
      </div>
      <div className="overflow-x-auto" role="presentation">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex border-b last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="flex-1 p-4">
                <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-20")} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 p-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <CardSkeleton rows={4} />
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i} className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
