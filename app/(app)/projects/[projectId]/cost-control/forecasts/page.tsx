import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { CcForecast } from '@/types/app'
import { Plus } from 'lucide-react'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<CcForecast>[] = [
  { key: 'period', header: 'Period', type: 'date' },
  { key: 'eac', header: 'EAC', type: 'currency', className: 'text-right' },
  { key: 'etc', header: 'ETC', type: 'currency', className: 'text-right' },
  { key: 'notes', header: 'Notes', className: 'text-gray-500 text-sm' },
]

const importColumns = [
  { key: 'period', label: 'Period', required: true },
  { key: 'eac', label: 'EAC' },
  { key: 'etc', label: 'ETC' },
  { key: 'notes', label: 'Notes' },
]

export default async function ForecastsPage({ params, searchParams }: Props) {
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

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  const { data, count } = await supabase
    .from('cc_forecasts')
    .select('id, period, eac, etc, notes', { count: 'exact' })
    .eq('project_id', projectId)
    .order('period', { ascending: false })
    .range(from, to)

  const base = `/projects/${projectId}/cost-control`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Forecasts</h1>
          <p className="text-sm text-gray-500">EAC and ETC by period</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="cc_forecasts" projectId={projectId} importColumns={importColumns} />
            <Button asChild>
              <Link href={`${base}/forecasts/new`}><Plus className="size-4 mr-2" />New Forecast</Link>
            </Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={(data ?? []) as CcForecast[]} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No forecasts recorded yet." />
    </div>
  )
}
