import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { QlPunch } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

const columns: Column<QlPunch>[] = [
  { key: 'punch_number', header: '#', className: 'w-20 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'category', header: 'Cat.', className: 'w-16 text-center' },
  { key: 'area', header: 'Area', className: 'w-28' },
  { key: 'raised_date', header: 'Raised', type: 'date', className: 'w-32' },
  { key: 'due_date', header: 'Due', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
]

const importColumns = [
  { key: 'punch_number', label: 'Punch Number' },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'area', label: 'Area' },
  { key: 'raised_date', label: 'Raised Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'status', label: 'Status' },
]

export default async function PunchPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'quality')
  if (!role) redirect('/projects')

  const { data, count } = await supabase
    .from('ql_punch')
    .select('id, punch_number, title, category, area, raised_date, due_date, status', { count: 'exact' })
    .eq('project_id', projectId)
    .order('raised_date', { ascending: false })
    .range(from, to)

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Punch List</h1></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="ql_punch" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/quality/punch/new`}><Plus className="w-4 h-4 mr-2" />Add Item</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={(data ?? []) as QlPunch[]} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No punch items." />
    </div>
  )
}
