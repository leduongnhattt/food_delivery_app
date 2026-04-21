"use client";

export function IncomePreview() {
  return (
    <div className="w-full space-y-6">
      <div className="h-12 w-64 rounded bg-gray-200" aria-hidden />
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <div className="h-4 w-40 rounded bg-gray-200" aria-hidden />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-24 rounded bg-gray-200" aria-hidden />
          <div className="h-24 rounded bg-gray-200" aria-hidden />
          <div className="h-24 rounded bg-gray-200" aria-hidden />
        </div>
      </div>
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <div className="h-4 w-48 rounded bg-gray-200" aria-hidden />
        <div className="mt-4 h-48 rounded bg-gray-200" aria-hidden />
      </div>
    </div>
  );
}

