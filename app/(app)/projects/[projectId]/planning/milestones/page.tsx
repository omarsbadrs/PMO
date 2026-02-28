import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { PlMilestone } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<PlMilestone>[] = [
  { key: 'name', header: 'Milestone' },
  { key: 'is_key_milestone', header: 'Key', type: 'key_milestone', className: 'w-16' },
  { key: 'planned_date', header: 'Planned', type: 'date', className: 'w-32' },
  { key: 'actual_date', header: 'Actual', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

const importColumns = [
  { key: 'name', label: 'Milestone Name', required: true },
  { key: 'description', label: 'Description' },
  { key: 'planned_date', label: 'Planned Date' },
  { key: 'actual_date', label: 'Actual Date' },
  { key: 'status', label: 'Status' },
  { key: 'is_key_milestone', label: 'Key Milestone' },
]

export default async function MilestonesPage({ params, searchParams }: Props) {
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
    .from('pl_milestones')
    .select('id, name, planned_date, actual_date, status, is_key_milestone', { count: 'exact' })
    .eq('project_id', projectId)
    .order('planned_date')
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Milestones</h1></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="pl_milestones" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/planning/milestones/new`}><Plus className="w-4 h-4 mr-2" />Add Milestone</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={(data ?? []) as PlMilestone[]} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No milestones defined." />
    </div>
  )
}
