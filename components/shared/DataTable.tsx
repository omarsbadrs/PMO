'use client'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// Built-in column type renderers — serializable, no functions needed
export type ColumnType =
  | 'status'
  | 'currency'
  | 'date'
  | 'percent'
  | 'truncate_uuid'
  | 'boolean_admin'
  | 'action_badge'
  | 'severity'
  | 'key_milestone'
  | 'result_badge'

export interface Column<T> {
  key: string
  header: string
  /** Only use render when this component is called FROM a 'use client' file */
  render?: (row: T) => React.ReactNode
  /** Use type instead of render when the parent is a Server Component */
  type?: ColumnType
  /** For type:'currency' — key of the per-row currency field (e.g. 'currency') */
  currencyKey?: string
  /** For type:'currency' — fixed currency for all rows (e.g. project currency); overridden by currencyKey */
  currency?: string
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  total?: number       // total row count from DB (enables server-side pagination)
  pageSize?: number    // rows per page, default 50
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    not_started: 'bg-gray-100 text-gray-700',
    under_review: 'bg-purple-100 text-purple-800',
    corrective_action: 'bg-orange-100 text-orange-800',
    under_investigation: 'bg-purple-100 text-purple-800',
    at_risk: 'bg-orange-100 text-orange-800',
    achieved: 'bg-green-100 text-green-800',
    missed: 'bg-red-100 text-red-800',
    accepted: 'bg-green-100 text-green-800',
    voided: 'bg-gray-100 text-gray-500',
  }
  return (
    <Badge className={`text-xs font-medium ${colorMap[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export { formatCurrency, formatDate } from '@/lib/utils/format'

const severityColor: Record<string, string> = {
  near_miss: 'bg-yellow-100 text-yellow-800',
  first_aid: 'bg-orange-100 text-orange-800',
  medical_treatment: 'bg-orange-200 text-orange-900',
  lti: 'bg-red-100 text-red-800',
  fatality: 'bg-red-200 text-red-900',
  minor: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const actionColor: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
}

const resultColor: Record<string, string> = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  conditional_pass: 'bg-yellow-100 text-yellow-800',
  hold: 'bg-orange-100 text-orange-800',
}

function renderBuiltIn(col: Column<Record<string, unknown>>, row: Record<string, unknown>): React.ReactNode {
  const val = row[col.key]

  switch (col.type) {
    case 'status':
      return <StatusBadge status={String(val ?? '')} />

    case 'currency': {
      const currency = col.currencyKey ? String(row[col.currencyKey] ?? col.currency ?? 'USD') : (col.currency ?? 'USD')
      return formatCurrency(val as number, currency)
    }

    case 'date':
      return formatDate(val as string)

    case 'percent':
      return `${val ?? 0}%`

    case 'truncate_uuid':
      return val ? String(val).split('-')[0] + '…' : '—'

    case 'boolean_admin':
      return val
        ? <Badge className="bg-purple-100 text-purple-800 text-xs">Global Admin</Badge>
        : <span className="text-sm text-gray-500">Member</span>

    case 'action_badge':
      return <Badge className={`text-xs ${actionColor[String(val)] ?? ''}`}>{String(val)}</Badge>

    case 'severity': {
      const s = String(val ?? '')
      return val
        ? <Badge className={`text-xs ${severityColor[s] ?? 'bg-gray-100 text-gray-700'}`}>{s.replace(/_/g, ' ')}</Badge>
        : null
    }

    case 'key_milestone':
      return val ? <Badge className="bg-blue-100 text-blue-800 text-xs">Key</Badge> : null

    case 'result_badge': {
      const s = String(val ?? '')
      return val
        ? <Badge className={`text-xs ${resultColor[s] ?? 'bg-gray-100 text-gray-700'}`}>{s.replace(/_/g, ' ')}</Badge>
        : null
    }

    default:
      return String(val ?? '—')
  }
}

export default function DataTable<T extends { id: string }>({
  columns, data, onRowClick, emptyMessage = 'No records found.',
  total = 0, pageSize = 50,
}: DataTableProps<T>) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const totalPages = Math.ceil(total / pageSize)

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead key={col.key} className={`font-semibold text-gray-700 ${col.className ?? ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-gray-400">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className ?? ''}>
                      {col.render
                        ? col.render(row)
                        : col.type
                          ? renderBuiltIn(col as Column<Record<string, unknown>>, row as Record<string, unknown>)
                          : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>{total} total records</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
