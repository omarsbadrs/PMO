import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { SfIncident } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<SfIncident>[] = [
  { key: 'incident_number', header: 'No.', className: 'w-24 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'severity', header: 'Severity', type: 'severity', className: 'w-36' },
  { key: 'incident_date', header: 'Date', type: 'date', className: 'w-32' },
  { key: 'location', header: 'Location', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
]

const importColumns = [
  { key: 'incident_number', label: 'Incident Number' },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'severity', label: 'Severity' },
  { key: 'incident_date', label: 'Incident Date' },
  { key: 'location', label: 'Location' },
  { key: 'injured_person', label: 'Injured Person' },
  { key: 'root_cause', label: 'Root Cause' },
  { key: 'status', label: 'Status' },
]

export default async function IncidentsPage({ params, searchParams }: Props) {
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
    .from('sf_incidents')
    .select('id, incident_number, title, severity, incident_date, location, status', { count: 'exact' })
    .eq('project_id', projectId)
    .order('incident_date', { ascending: false })
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Incidents</h1><p className="text-sm text-gray-500">Near-misses, first aid, LTIs and fatalities</p></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="sf_incidents" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/safety/incidents/new`}><Plus className="w-4 h-4 mr-2" />Report Incident</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No incidents recorded." />
    </div>
  )
}
