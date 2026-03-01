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

type CommitmentRow = {
  id: string
  po_number: string | null
  vendor: string
  description: string
  amount: number | null
  currency: string
  fx_rate: number
  project_amount: number
  issue_date: string | null
  status: string
}

const importColumns = [
  { key: 'po_number', label: 'PO Number' },
  { key: 'vendor', label: 'Vendor', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'amount', label: 'Amount' },
  { key: 'currency', label: 'Currency' },
  { key: 'fx_rate', label: 'FX Rate' },
  { key: 'status', label: 'Status' },
  { key: 'issue_date', label: 'Issue Date' },
  { key: 'expiry_date', label: 'Expiry Date' },
]

export default async function CommitmentsPage({ params, searchParams }: Props) {
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
      .from('cc_commitments')
      .select('id, po_number, vendor, description, amount, currency, fx_rate, status, issue_date', { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('projects').select('currency').eq('id', projectId).single(),
  ])

  const projectCurrency = projectData?.currency ?? 'USD'

  const rows: CommitmentRow[] = (data ?? []).map((r) => ({
    ...r,
    currency: r.currency ?? 'USD',
    fx_rate: r.fx_rate ?? 1,
    project_amount: (r.amount ?? 0) * (r.fx_rate ?? 1),
  }))

  const projectHeader = 'Project (' + projectCurrency + ')'

  const columns: Column<CommitmentRow>[] = [
    { key: 'po_number', header: 'PO #', className: 'w-28 font-mono text-sm' },
    { key: 'vendor', header: 'Vendor', className: 'w-36' },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Doc Amount', type: 'currency', currencyKey: 'currency', className: 'text-right w-32' },
    { key: 'currency', header: 'Doc Currency', className: 'w-24 text-center font-mono text-sm' },
    { key: 'fx_rate', header: 'FX Rate', className: 'text-right w-24' },
    { key: 'project_amount', header: projectHeader, type: 'currency', currency: projectCurrency, className: 'text-right w-36 font-medium' },
    { key: 'issue_date', header: 'Issue Date', type: 'date', className: 'w-28' },
    { key: 'status', header: 'Status', type: 'status', className: 'w-24' },
  ]

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Commitments</h1>
          <p className="text-sm text-gray-500">Purchase orders and subcontracts</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="cc_commitments" projectId={projectId} importColumns={importColumns} />
            <Button asChild>
              <Link href={`/projects/${projectId}/cost-control/commitments/new`}>
                <Plus className="w-4 h-4 mr-2" /> Add Commitment
              </Link>
            </Button>
          </div>
        )}
      </div>
      <DataTable columns={columns} data={rows} total={count ?? 0} pageSize={PAGE_SIZE} emptyMessage="No commitments yet." />
    </div>
  )
}
