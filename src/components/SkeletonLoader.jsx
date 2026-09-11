export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/20 p-4 h-[380px] flex flex-col justify-between shimmer">
      <div>
        {/* Thumbnail Image Placeholder */}
        <div className="aspect-[2/3] w-full rounded-xl bg-slate-800/50 mb-4"></div>
        {/* Title Placeholder */}
        <div className="h-5 w-3/4 rounded bg-slate-800/50 mb-2"></div>
        {/* Subtitle Placeholder */}
