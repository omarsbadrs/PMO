import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { CcChange } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<CcChange>[] = [
  { key: 'change_number', header: 'Change #', className: 'w-28 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'type', header: 'Type', className: 'w-28' },
  { key: 'amount', header: 'Amount', type: 'currency', className: 'text-right w-36' },
  { key: 'submitted_date', header: 'Submitted', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

const importColumns = [
  { key: 'change_number', label: 'Change Number' },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'approved_amount', label: 'Approved Amount' },
  { key: 'submitted_date', label: 'Submitted Date' },
  { key: 'approved_date', label: 'Approved Date' },
]

export default async function ChangesPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'cost_control')
  if (!role) redirect('/projects')

  const { data, count } = await supabase
    .from('cc_changes')
    .select('id, change_number, title, type, status, amount, submitted_date', { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Change Orders</h1><p className="text-sm text-gray-500">Variations and change orders</p></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="cc_changes" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/cost-control/changes/new`}><Plus className="w-4 h-4 mr-2" />Add Change</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No change orders yet." />
    </div>
  )
}
