import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { CcCommitment } from '@/types/app'
import { getUserModuleRole } from '@/lib/auth/helpers'

interface Props { params: Promise<{ projectId: string }> }

const columns: Column<CcCommitment>[] = [
  { key: 'po_number', header: 'PO #', className: 'w-28 font-mono text-sm' },
  { key: 'vendor', header: 'Vendor' },
  { key: 'description', header: 'Description' },
  { key: 'amount', header: 'Amount', type: 'currency', currencyKey: 'currency', className: 'text-right w-36' },
  { key: 'issue_date', header: 'Issue Date', type: 'date', className: 'w-32' },
  { key: 'status', header: 'Status', type: 'status', className: 'w-28' },
]

export default async function CommitmentsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'cost_control')
  if (!role) redirect('/projects')

  const { data } = await supabase
    .from('cc_commitments').select('*').eq('project_id', projectId).order('created_at', { ascending: false })

  const canWrite = ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Commitments</h1>
          <p className="text-sm text-gray-500">Purchase orders and subcontracts</p>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href={`/projects/${projectId}/cost-control/commitments/new`}>
              <Plus className="w-4 h-4 mr-2" /> Add Commitment
            </Link>
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={data ?? []} total={data?.length ?? 0} emptyMessage="No commitments yet." />
    </div>
  )
}
