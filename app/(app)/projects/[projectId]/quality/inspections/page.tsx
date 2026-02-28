import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { QlInspection } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<QlInspection>[] = [
  { key: 'inspection_number', header: '#', className: 'w-28 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'type', header: 'Type', className: 'w-28' },
  { key: 'inspection_date', header: 'Date', type: 'date', className: 'w-32' },
  { key: 'result', header: 'Result', type: 'result_badge', className: 'w-28' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

const importColumns = [
  { key: 'inspection_number', label: 'Inspection Number' },
  { key: 'title', label: 'Title', required: true },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'inspection_date', label: 'Inspection Date' },
  { key: 'result', label: 'Result' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
]

export default async function InspectionsPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'quality')
  if (!role) redirect('/projects')

  const { data, count } = await supabase
    .from('ql_inspections')
    .select('id, inspection_number, title, type, inspection_date, result, status', { count: 'exact' })
    .eq('project_id', projectId)
    .order('inspection_date', { ascending: false })
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Inspections</h1><p className="text-sm text-gray-500">ITP checks and inspections</p></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="ql_inspections" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/quality/inspections/new`}><Plus className="w-4 h-4 mr-2" />Add Inspection</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No inspections recorded." />
    </div>
  )
}
