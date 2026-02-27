import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { QlPunch } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<QlPunch>[] = [
  { key: 'punch_number', header: '#', className: 'w-20 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'category', header: 'Cat.', className: 'w-16 text-center' },
  { key: 'area', header: 'Area', className: 'w-28' },
  { key: 'raised_date', header: 'Raised', type: 'date', className: 'w-32' },
  { key: 'due_date', header: 'Due', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
]

export default async function PunchPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'quality')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('ql_punch').select('*').eq('project_id', projectId).order('raised_date', { ascending: false })
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Punch List</h1></div>
        {canWrite && <Button asChild><Link href={`/projects/${projectId}/quality/punch/new`}><Plus className="w-4 h-4 mr-2" />Add Item</Link></Button>}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No punch items." />
    </div>
  )
}
