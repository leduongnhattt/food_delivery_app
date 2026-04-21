"use client";

export function BankAccountsPreview() {
  return (
    <div className="w-full space-y-6">
      <div className="h-12 w-64 rounded bg-gray-200" aria-hidden />
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <div className="h-4 w-44 rounded bg-gray-200" aria-hidden />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="min-h-80 rounded bg-gray-200" aria-hidden />
          <div className="min-h-80 rounded bg-gray-200" aria-hidden />
          <div className="min-h-80 rounded bg-gray-200" aria-hidden />
        </div>
      </div>
    </div>
  );
}

