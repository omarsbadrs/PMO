import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { PlActivity } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<PlActivity>[] = [
  { key: 'activity_id', header: 'ID', className: 'w-24 font-mono text-sm' },
  { key: 'name', header: 'Activity Name' },
  { key: 'wbs', header: 'WBS', className: 'w-24' },
  { key: 'planned_start', header: 'Start', type: 'date', className: 'w-32' },
  { key: 'planned_finish', header: 'Finish', type: 'date', className: 'w-32' },
  { key: 'percent_complete', header: '% Complete', type: 'percent', className: 'w-28 text-right' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

const importColumns = [
  { key: 'activity_id', label: 'Activity ID' },
  { key: 'name', label: 'Activity Name', required: true },
  { key: 'wbs', label: 'WBS' },
  { key: 'planned_start', label: 'Planned Start' },
  { key: 'planned_finish', label: 'Planned Finish' },
  { key: 'actual_start', label: 'Actual Start' },
  { key: 'actual_finish', label: 'Actual Finish' },
  { key: 'duration_days', label: 'Duration (days)' },
  { key: 'percent_complete', label: '% Complete' },
  { key: 'status', label: 'Status' },
]

export default async function ActivitiesPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'planning')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('pl_activities').select('*').eq('project_id', projectId).order('wbs').order('planned_start')
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Activities</h1><p className="text-sm text-gray-500">Schedule activities and progress</p></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="pl_activities" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/planning/activities/new`}><Plus className="w-4 h-4 mr-2" />Add Activity</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No activities yet." />
    </div>
  )
}
