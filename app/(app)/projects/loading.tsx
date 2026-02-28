export default function ProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
