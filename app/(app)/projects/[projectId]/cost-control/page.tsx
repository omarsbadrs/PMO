import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, FileText, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface Props { params: Promise<{ projectId: string }> }

export default async function CostControlDashboard({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [budget, actuals, commitments, changes] = await Promise.all([
    supabase.from('cc_budget').select('approved_amount').eq('project_id', projectId),
    supabase.from('cc_actuals').select('amount').eq('project_id', projectId),
    supabase.from('cc_commitments').select('amount').eq('project_id', projectId),
    supabase.from('cc_changes').select('approved_amount, status').eq('project_id', projectId),
  ])

  const totalBudget = budget.data?.reduce((s, r) => s + (r.approved_amount ?? 0), 0) ?? 0
  const totalActuals = actuals.data?.reduce((s, r) => s + (r.amount ?? 0), 0) ?? 0
  const totalCommitments = commitments.data?.reduce((s, r) => s + (r.amount ?? 0), 0) ?? 0
  const openChanges = changes.data?.filter((c) => c.status === 'draft' || c.status === 'pending').length ?? 0

  const base = `/projects/${projectId}/cost-control`

  const stats = [
    { label: 'Total Budget', value: formatCurrency(totalBudget), icon: DollarSign, color: 'text-blue-600' },
    { label: 'Actual Costs', value: formatCurrency(totalActuals), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Commitments', value: formatCurrency(totalCommitments), icon: FileText, color: 'text-orange-600' },
    { label: 'Open Changes', value: String(openChanges), icon: AlertTriangle, color: 'text-red-600' },
  ]

  const links = [
    { href: `${base}/budget`, label: 'Budget' },
    { href: `${base}/commitments`, label: 'Commitments' },
    { href: `${base}/actuals`, label: 'Actual Costs' },
    { href: `${base}/forecasts`, label: 'Forecasts' },
    { href: `${base}/changes`, label: 'Changes' },
    { href: `${base}/documents`, label: 'Documents' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cost Control</h1>
        <p className="text-sm text-gray-500 mt-1">Budget, commitments, actuals & forecasts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {links.map(({ href, label }) => (
          <Button key={href} variant="outline" asChild>
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
