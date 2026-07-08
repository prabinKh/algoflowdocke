import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 flex flex-col gap-3">
      {/* Image */}
      <Skeleton className="w-full aspect-square rounded-xl" />
      {/* Badge row */}
      <div className="flex gap-2">
        <Skeleton className="h-4 w-10 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      {/* Name */}
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
      {/* Specs */}
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      {/* Price */}
      <div className="flex items-center justify-between mt-auto">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
