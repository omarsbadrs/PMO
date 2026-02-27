import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { CcBudget } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<CcBudget>[] = [
  { key: 'code', header: 'Code', className: 'w-24 font-mono text-sm' },
  { key: 'description', header: 'Description' },
  { key: 'discipline', header: 'Discipline', className: 'w-32' },
  { key: 'baseline_amount', header: 'Baseline', type: 'currency', className: 'text-right w-36' },
  { key: 'approved_amount', header: 'Approved', type: 'currency', className: 'text-right w-36' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

export default async function BudgetPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await getUserModuleRole(projectId, 'cost_control')
  if (!role) redirect('/projects')

  const { data: budgets } = await supabase
    .from('cc_budget')
    .select('*')
    .eq('project_id', projectId)
    .order('code', { ascending: true })

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Budget</h1>
          <p className="text-sm text-gray-500">Baseline and approved budget items</p>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href={`/projects/${projectId}/cost-control/budget/new`}>
              <Plus className="w-4 h-4 mr-2" /> Add Budget Item
            </Link>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={budgets ?? []}
        total={budgets?.length ?? 0}
        emptyMessage="No budget items yet."
      />
    </div>
  )
}
