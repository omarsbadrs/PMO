export default function ProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-200 rounded" />
            </div>
            <div className="h-7 w-20 bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b bg-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3 border-b last:border-0">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded" style={{ width: `${60 + (j * 10) % 40}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
