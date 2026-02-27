import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { SfObservation } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<SfObservation>[] = [
  { key: 'observation_number', header: 'No.', className: 'w-24 font-mono text-sm' },
  { key: 'type', header: 'Type', className: 'w-28' },
  { key: 'description', header: 'Description' },
  { key: 'location', header: 'Location', className: 'w-32' },
  { key: 'observed_date', header: 'Date', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
]

export default async function ObservationsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'safety')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('sf_observations').select('*').eq('project_id', projectId).order('observed_date', { ascending: false })
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Observations</h1><p className="text-sm text-gray-500">Safety walks and observations</p></div>
        {canWrite && <Button asChild><Link href={`/projects/${projectId}/safety/observations/new`}><Plus className="w-4 h-4 mr-2" />Add Observation</Link></Button>}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No observations recorded." />
    </div>
  )
}
