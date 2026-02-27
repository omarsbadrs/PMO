import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { CcActual } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<CcActual>[] = [
  { key: 'invoice_number', header: 'Invoice #', className: 'w-32 font-mono text-sm' },
  { key: 'vendor', header: 'Vendor', className: 'w-40' },
  { key: 'description', header: 'Description' },
  { key: 'amount', header: 'Amount', type: 'currency', className: 'text-right w-36' },
  { key: 'cost_date', header: 'Date', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

const importColumns = [
  { key: 'invoice_number', label: 'Invoice Number' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'description', label: 'Description', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'cost_date', label: 'Cost Date' },
  { key: 'status', label: 'Status' },
]

export default async function ActualsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'cost_control')
  if (!role) redirect('/projects')
  const { data } = await supabase.from('cc_actuals').select('*').eq('project_id', projectId).order('cost_date', { ascending: false })
  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Actual Costs</h1><p className="text-sm text-gray-500">Cost lines and invoices</p></div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="cc_actuals" projectId={projectId} importColumns={importColumns} />
            <Button asChild><Link href={`/projects/${projectId}/cost-control/actuals/new`}><Plus className="w-4 h-4 mr-2" />Add Actual</Link></Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No actual costs recorded." />
    </div>
  )
}
