export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-navy-800" />
        <div className="h-8 w-8 rounded-lg bg-navy-800" />
      </div>
      <div className="mt-3 h-8 w-16 rounded bg-navy-800" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card animate-pulse rounded-xl p-6">
      <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-4 rounded bg-navy-800" />
            <div className="h-4 flex-1 rounded bg-navy-800" />
            <div className="h-4 w-20 rounded bg-navy-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({ width = "w-full" }: { width?: string }) {
  return <div className={`h-4 ${width} animate-pulse rounded bg-navy-800`} />;
}
