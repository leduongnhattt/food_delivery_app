export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Search Bar Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Categories List Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header Skeleton */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="col-span-3 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Table Body Skeleton */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="col-span-3">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex gap-2">
                      <div className="h-7 w-12 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
