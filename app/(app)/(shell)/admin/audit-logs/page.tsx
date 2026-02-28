import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { AuditLog } from '@/types/app'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ page?: string }>
}

const columns: Column<AuditLog>[] = [
  { key: 'action', header: 'Action', type: 'action_badge', className: 'w-24' },
  { key: 'table_name', header: 'Table', className: 'w-36 font-mono text-sm' },
  { key: 'record_id', header: 'Record ID', type: 'truncate_uuid', className: 'w-44 font-mono text-xs text-gray-400' },
  { key: 'actor_user_id', header: 'Actor', type: 'truncate_uuid', className: 'w-44 font-mono text-xs text-gray-400' },
  { key: 'created_at', header: 'Time', type: 'date', className: 'w-36' },
]

export default async function AuditLogsPage({ searchParams }: Props) {
  await requireGlobalAdmin()
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()

  const { data, count } = await admin
    .from('audit_logs')
    .select('id, actor_user_id, action, table_name, record_id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-500">Database changes</p>
      </div>
      <DataTable
        columns={columns}
        data={(data ?? []) as AuditLog[]}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
        emptyMessage="No audit logs yet."
      />
    </div>
  )
}
