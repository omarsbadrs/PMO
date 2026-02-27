import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { AuditLog } from '@/types/app'

const columns: Column<AuditLog>[] = [
  { key: 'action', header: 'Action', type: 'action_badge', className: 'w-24' },
  { key: 'table_name', header: 'Table', className: 'w-36 font-mono text-sm' },
  { key: 'record_id', header: 'Record ID', type: 'truncate_uuid', className: 'w-44 font-mono text-xs text-gray-400' },
  { key: 'actor_user_id', header: 'Actor', type: 'truncate_uuid', className: 'w-44 font-mono text-xs text-gray-400' },
  { key: 'created_at', header: 'Time', type: 'date', className: 'w-36' },
]

export default async function AuditLogsPage() {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-500">Last 200 database changes</p>
      </div>
      <DataTable
        columns={columns}
        data={(data ?? []) as AuditLog[]}
        total={data?.length ?? 0}
        emptyMessage="No audit logs yet."
      />
    </div>
  )
}
