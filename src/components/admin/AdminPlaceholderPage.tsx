export default function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-slate-600">{description}</p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Content coming soon.
        </div>
      </div>
    </div>
  )
}
