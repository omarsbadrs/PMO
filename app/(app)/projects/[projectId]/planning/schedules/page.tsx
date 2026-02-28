import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Schedule {
  id: string
  name: string
  type: string | null
  revision_number: number | null
  baseline_date: string | null
  data_date: string | null
  status: string | null
  notes: string | null
}

const columns: Column<Schedule>[] = [
  { key: 'name', header: 'Schedule Name' },
  { key: 'type', header: 'Type', className: 'w-28' },
  { key: 'revision_number', header: 'Rev.', className: 'w-16 text-center' },
  { key: 'baseline_date', header: 'Baseline', type: 'date', className: 'w-32' },
  { key: 'data_date', header: 'Data Date', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

const importColumns = [
  { key: 'name', label: 'Schedule Name', required: true },
  { key: 'type', label: 'Type' },
  { key: 'revision_number', label: 'Revision No.' },
  { key: 'baseline_date', label: 'Baseline Date' },
  { key: 'data_date', label: 'Data Date' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
]

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function SchedulesPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await getUserModuleRole(projectId, 'planning')
  if (!role) redirect('/projects')

  const { data, count } = await supabase
    .from('pl_schedules')
    .select('id, name, type, revision_number, baseline_date, data_date, status', { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schedules</h1>
          <p className="text-sm text-gray-500">Project schedule baselines and revisions</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="pl_schedules" projectId={projectId} importColumns={importColumns} />
            <Button asChild>
              <Link href={`/projects/${projectId}/planning/schedules/new`}>
                <Plus className="w-4 h-4 mr-2" />Add Schedule
              </Link>
            </Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No schedules defined." />
    </div>
  )
}
