import Link from 'next/link'

export interface ModuleNavItem {
  href: string
  label: string
  icon: React.ElementType
  count?: number
  meta?: string  // e.g. "$1.2M" or "3 open"
}

export default function ModuleNav({ items }: { items: ModuleNavItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ href, label, icon: Icon, count, meta }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
              <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </div>
            {count !== undefined && (
              <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-600 transition-colors">
                {count}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors leading-tight">
              {label}
            </p>
            {meta && (
              <p className="text-xs text-gray-400 mt-0.5 group-hover:text-blue-500 transition-colors">
                {meta}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
