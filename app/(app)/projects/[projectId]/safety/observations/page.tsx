import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { SfObservation } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<SfObservation>[] = [
  { key: 'observation_number', header: 'No.', className: 'w-24 font-mono text-sm' },
  { key: 'type', header: 'Type', className: 'w-28' },
  { key: 'description', header: 'Description' },
  { key: 'location', header: 'Location', className: 'w-32' },
  { key: 'observed_date', header: 'Date', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
]

const importColumns = [
  { key: 'observation_number', label: 'Observation Number' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description', required: true },
  { key: 'location', label: 'Location' },
  { key: 'observed_date', label: 'Observed Date' },
  { key: 'status', label: 'Status' },
  { key: 'corrective_action', label: 'Corrective Action' },
  { key: 'closed_date', label: 'Closed Date' },
]

export default async function ObservationsPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'safety')
  if (!role) redirect('/projects')

  const { data, count } = await supabase
    .from('sf_observations')
    .select('id, observation_number, type, description, location, observed_date, status', { count: 'exact' })
    .eq('project_id', projectId)
    .order('observed_date', { ascending: false })
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Observations</h1><p className="text-sm text-gray-500">Safety walks and observations</p></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="sf_observations" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/safety/observations/new`}><Plus className="w-4 h-4 mr-2" />Add Observation</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No observations recorded." />
    </div>
  )
}
