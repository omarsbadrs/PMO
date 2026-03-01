import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import CsvImportButton from '@/components/shared/CsvImportButton'
import type { CcBudget } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

const PAGE_SIZE = 50

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}



const importColumns = [
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description', required: true },
  { key: 'discipline', label: 'Discipline' },
  { key: 'baseline_amount', label: 'Baseline Amount' },
  { key: 'approved_amount', label: 'Approved Amount' },
  { key: 'revision_number', label: 'Revision Number' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
]

export default async function BudgetPage({ params, searchParams }: Props) {
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

  const [{ data: budgets, count }, { data: projectData }] = await Promise.all([
    supabase
      .from('cc_budget')
      .select('id, code, description, discipline, baseline_amount, approved_amount, status', { count: 'exact' })
      .eq('project_id', projectId)
      .order('code', { ascending: true })
      .range(from, to),
    supabase.from('projects').select('currency').eq('id', projectId).single(),
  ])

  const projectCurrency = projectData?.currency ?? 'USD'

  const columns: Column<CcBudget>[] = [
    { key: 'code', header: 'Code', className: 'w-24 font-mono text-sm' },
    { key: 'description', header: 'Description' },
    { key: 'discipline', header: 'Discipline', className: 'w-32' },
    { key: 'baseline_amount', header: 'Baseline', type: 'currency', currency: projectCurrency, className: 'text-right w-36' },
    { key: 'approved_amount', header: 'Approved', type: 'currency', currency: projectCurrency, className: 'text-right w-36' },
    { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
  ]

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Budget</h1>
          <p className="text-sm text-gray-500">Baseline and approved budget items</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <CsvImportButton table="cc_budget" projectId={projectId} importColumns={importColumns} />
            <Button asChild>
              <Link href={`/projects/${projectId}/cost-control/budget/new`}>
                <Plus className="w-4 h-4 mr-2" /> Add Budget Item
              </Link>
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={(budgets ?? []) as CcBudget[]}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
        emptyMessage="No budget items yet."
      />
    </div>
  )
}
