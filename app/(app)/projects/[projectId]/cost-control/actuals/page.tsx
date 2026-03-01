import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}

type ActualRow = {
  id: string
  invoice_number: string | null
  vendor: string | null
  description: string
  amount: number
  document_currency: string
  fx_rate: number
  project_amount: number
  cost_date: string | null
  status: string
}

const importColumns = [
  { key: 'invoice_number', label: 'Invoice Number' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'description', label: 'Description', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'document_currency', label: 'Document Currency' },
  { key: 'fx_rate', label: 'FX Rate' },
  { key: 'cost_date', label: 'Cost Date' },
  { key: 'status', label: 'Status' },
]

export default async function ActualsPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'cost_control')
  if (!role) redirect('/projects')

  const [{ data, count }, { data: projectData }] = await Promise.all([
    supabase
      .from('cc_actuals')
      .select('id, invoice_number, vendor, description, amount, document_currency, fx_rate, cost_date, status', { count: 'exact' })
      .eq('project_id', projectId)
      .order('cost_date', { ascending: false })
      .range(from, to),
    supabase.from('projects').select('currency').eq('id', projectId).single(),
  ])

  const projectCurrency = projectData?.currency ?? 'USD'

  const rows: ActualRow[] = (data ?? []).map((r) => ({
    ...r,
    document_currency: r.document_currency ?? 'USD',
    fx_rate: r.fx_rate ?? 1,
    project_amount: (r.amount ?? 0) * (r.fx_rate ?? 1),
  }))

  const projectHeader = 'Project (' + projectCurrency + ')'

  const columns: Column<ActualRow>[] = [
    { key: 'invoice_number', header: 'Invoice #', className: 'w-32 font-mono text-sm' },
    { key: 'vendor', header: 'Vendor', className: 'w-36' },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Doc Amount', type: 'currency', currencyKey: 'document_currency', className: 'text-right w-32' },
    { key: 'document_currency', header: 'Doc Currency', className: 'w-24 text-center font-mono text-sm' },
    { key: 'fx_rate', header: 'FX Rate', className: 'text-right w-24' },
    { key: 'project_amount', header: projectHeader, type: 'currency', currency: projectCurrency, className: 'text-right w-36 font-medium' },
    { key: 'cost_date', header: 'Date', type: 'date', className: 'w-28' },
    { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
  ]

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
      <DataTable columns={columns} data={rows} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No actual costs recorded." />
    </div>
  )
}
