import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { QlNcr } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<QlNcr>[] = [
  { key: 'ncr_number', header: 'NCR #', className: 'w-24 font-mono text-sm' },
  { key: 'title', header: 'Title' },
  { key: 'severity', header: 'Severity', type: 'severity', className: 'w-28' },
  { key: 'area', header: 'Area', className: 'w-28' },
  { key: 'raised_date', header: 'Raised', type: 'date', className: 'w-32' },
  { key: 'due_date', header: 'Due', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
]

const importColumns = [
  { key: 'ncr_number', label: 'NCR Number' },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'severity', label: 'Severity' },
  { key: 'area', label: 'Area' },
  { key: 'raised_date', label: 'Raised Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'root_cause', label: 'Root Cause' },
  { key: 'corrective_action', label: 'Corrective Action' },
  { key: 'status', label: 'Status' },
]

export default async function NcrPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'quality')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('ql_ncr').select('*').eq('project_id', projectId).order('raised_date', { ascending: false })
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Non-Conformance Reports</h1></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="ql_ncr" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/quality/ncr/new`}><Plus className="w-4 h-4 mr-2" />Raise NCR</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No NCRs raised." />
    </div>
  )
}
