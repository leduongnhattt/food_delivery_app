export default function ReviewsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-80 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="h-10 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

