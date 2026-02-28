import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { Project } from '@/types/app'

const columns: Column<Project>[] = [
  { key: 'code', header: 'Code', className: 'w-28 font-mono text-sm' },
  { key: 'name', header: 'Project Name' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
  { key: 'start_date', header: 'Start', type: 'date', className: 'w-32' },
  { key: 'end_date', header: 'End', type: 'date', className: 'w-32' },
]

export default async function AdminProjectsPage() {
  await requireGlobalAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Projects</h1></div>
        <Button asChild><Link href="/admin/projects/new"><Plus className="w-4 h-4 mr-2" />New Project</Link></Button>
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No projects yet." />
    </div>
  )
}
