export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/20 p-4 h-[380px] flex flex-col justify-between shimmer">
      <div>
        {/* Thumbnail Image Placeholder */}
        <div className="aspect-[2/3] w-full rounded-xl bg-slate-800/50 mb-4"></div>
        {/* Title Placeholder */}
        <div className="h-5 w-3/4 rounded bg-slate-800/50 mb-2"></div>
        {/* Subtitle Placeholder */}
        <div className="h-4 w-1/2 rounded bg-slate-800/30"></div>
      </div>
      
      {/* Footer Placeholder */}
      <div className="flex items-center justify-between mt-4">
        <div className="h-4 w-12 rounded bg-slate-800/30"></div>
        <div className="h-8 w-8 rounded-lg bg-slate-800/50"></div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonDetails() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-slate-900/30 border border-slate-800/40 rounded-3xl shimmer relative overflow-hidden">
      {/* Back button skeleton */}
      <div className="h-8 w-24 rounded-lg bg-slate-800/50 mb-8"></div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image poster skeleton */}
        <div className="w-full md:w-64 aspect-[2/3] md:h-96 rounded-2xl bg-slate-800/50 shrink-0"></div>
        
{/* Text information skeleton */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="h-10 w-2/3 rounded-xl bg-slate-800/50 mb-3"></div>
            <div className="h-5 w-1/3 rounded-md bg-slate-800/30"></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-800/50"></div>
            <div className="h-6 w-16 rounded-full bg-slate-800/50"></div>
            <div className="h-6 w-16 rounded-full bg-slate-800/50"></div>
          </div>