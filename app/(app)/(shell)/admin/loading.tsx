export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded" />
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b bg-gray-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-4 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-4 w-16 bg-gray-100 rounded self-center" />
            <div className="h-5 w-14 bg-gray-100 rounded-full self-center" />
            <div className="h-4 w-4 bg-gray-100 rounded self-center ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
