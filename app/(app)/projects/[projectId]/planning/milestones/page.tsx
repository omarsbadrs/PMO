import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { PlMilestone } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<PlMilestone>[] = [
  { key: 'name', header: 'Milestone' },
  { key: 'is_key_milestone', header: 'Key', type: 'key_milestone', className: 'w-16' },
  { key: 'planned_date', header: 'Planned', type: 'date', className: 'w-32' },
  { key: 'actual_date', header: 'Actual', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

export default async function MilestonesPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'planning')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('pl_milestones').select('*').eq('project_id', projectId).order('planned_date')
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Milestones</h1></div>
        {canWrite && <Button asChild><Link href={`/projects/${projectId}/planning/milestones/new`}><Plus className="w-4 h-4 mr-2" />Add Milestone</Link></Button>}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No milestones defined." />
    </div>
  )
}
