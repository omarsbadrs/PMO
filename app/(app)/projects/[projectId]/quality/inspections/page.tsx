import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { QlInspection } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<QlInspection>[] = [
  { key: 'inspection_number', header: '#', className: 'w-28 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'type', header: 'Type', className: 'w-28' },
  { key: 'inspection_date', header: 'Date', type: 'date', className: 'w-32' },
  { key: 'result', header: 'Result', type: 'result_badge', className: 'w-28' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

export default async function InspectionsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'quality')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('ql_inspections').select('*').eq('project_id', projectId).order('inspection_date', { ascending: false })
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Inspections</h1><p className="text-sm text-gray-500">ITP checks and inspections</p></div>
        {canWrite && <Button asChild><Link href={`/projects/${projectId}/quality/inspections/new`}><Plus className="w-4 h-4 mr-2" />Add Inspection</Link></Button>}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No inspections recorded." />
    </div>
  )
}
