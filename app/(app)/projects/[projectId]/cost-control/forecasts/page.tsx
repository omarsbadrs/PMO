import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { CcForecast } from '@/types/app'
import { Plus } from 'lucide-react'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<CcForecast>[] = [
  { key: 'period', header: 'Period', type: 'date' },
  { key: 'eac', header: 'EAC', type: 'currency', className: 'text-right' },
  { key: 'etc', header: 'ETC', type: 'currency', className: 'text-right' },
  { key: 'notes', header: 'Notes', className: 'text-gray-500 text-sm' },
]

export default async function ForecastsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('cc_forecasts')
    .select('*')
    .eq('project_id', projectId)
    .order('period', { ascending: false })

  const base = `/projects/${projectId}/cost-control`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Forecasts</h1>
          <p className="text-sm text-gray-500">EAC and ETC by period</p>
        </div>
        <Button asChild>
          <Link href={`${base}/forecasts/new`}>
            <Plus className="size-4 mr-2" />New Forecast
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={(data ?? []) as CcForecast[]}
        total={data?.length ?? 0}
        emptyMessage="No forecasts recorded yet."
      />
    </div>
  )
}
