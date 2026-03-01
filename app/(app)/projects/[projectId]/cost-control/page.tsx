import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleRole } from '@/lib/auth/helpers'
import { DollarSign, FileText, ReceiptText, BarChart3, FolderOpen, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import ModuleNav from '@/components/dashboard/ModuleNav'
import CostControlKPIs from '@/components/dashboard/CostControlKPIs'

interface Props { params: Promise<{ projectId: string }> }

export default async function CostControlDashboard({ params }: Props) {
  const { projectId } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'cost_control')
  if (!role) redirect(`/projects/${projectId}`)

  const [projectRes, budgetRes, actualsRes, commitmentsRes, changesRes, forecastsRes] = await Promise.all([
    db.from('projects').select('currency, usd_rate').eq('id', projectId).single(),
    db.from('cc_budget').select('discipline, approved_amount, baseline_amount, status').eq('project_id', projectId),
    db.from('cc_actuals').select('amount, fx_rate, vendor').eq('project_id', projectId),
    db.from('cc_commitments').select('amount, fx_rate, status, vendor').eq('project_id', projectId),
    db.from('cc_changes').select('amount, approved_amount, status').eq('project_id', projectId),
    db.from('cc_forecasts').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
  ])

  const projectCurrency = projectRes.data?.currency ?? 'USD'
  const usdRate = projectRes.data?.usd_rate ?? 1

  const budgetItems      = budgetRes.data ?? []
  const actualsItems     = actualsRes.data ?? []
  const commitmentsItems = commitmentsRes.data ?? []
  const changesItems     = changesRes.data ?? []

  // ── KPI calculations (amounts in project currency via fx_rate) ────────────
  const totalBudget      = budgetItems.reduce((s, r) => s + (r.approved_amount ?? r.baseline_amount ?? 0), 0)
  const totalActuals     = actualsItems.reduce((s, r) => s + (r.amount ?? 0) * (r.fx_rate ?? 1), 0)
  const totalCommitments = commitmentsItems.reduce((s, r) => s + (r.amount ?? 0) * (r.fx_rate ?? 1), 0)
  const remaining        = totalBudget - totalActuals - totalCommitments
  const utilization      = totalBudget > 0 ? ((totalActuals + totalCommitments) / totalBudget) * 100 : 0

  const openChanges    = changesItems.filter(c => ['draft', 'pending', 'submitted'].includes(c.status ?? ''))
  const openChangesAmt = openChanges.reduce((s, c) => s + (c.amount ?? 0), 0)
  const approvedChanges = changesItems.filter(c => c.status === 'approved')
  const approvedAmt    = approvedChanges.reduce((s, c) => s + (c.approved_amount ?? 0), 0)

  // ── Chart data ─────────────────────────────────────────────────────────────
  const disciplineMap: Record<string, { budget: number; actuals: number }> = {}
  budgetItems.forEach(r => {
    const d = r.discipline?.trim() || 'Other'
    if (!disciplineMap[d]) disciplineMap[d] = { budget: 0, actuals: 0 }
    disciplineMap[d].budget += r.approved_amount ?? r.baseline_amount ?? 0
  })
  const budgetByDiscipline = Object.entries(disciplineMap)
    .map(([discipline, v]) => ({
      discipline,
      budget: v.budget,
      actuals: totalBudget > 0 ? (v.budget / totalBudget) * totalActuals : 0,
    }))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8)

  const vendorMap: Record<string, number> = {}
  actualsItems.forEach(r => {
    const v = r.vendor?.trim() || 'Other'
    vendorMap[v] = (vendorMap[v] ?? 0) + (r.amount ?? 0) * (r.fx_rate ?? 1)
  })
  const actualsByVendor = Object.entries(vendorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([vendor, amount]) => ({ vendor, amount }))

  const statusMap: Record<string, { count: number; amount: number }> = {}
  commitmentsItems.forEach(r => {
    const s = r.status?.trim() || 'unknown'
    if (!statusMap[s]) statusMap[s] = { count: 0, amount: 0 }
    statusMap[s].count++
    statusMap[s].amount += (r.amount ?? 0) * (r.fx_rate ?? 1)
  })
  const commitmentsByStatus = Object.entries(statusMap).map(([status, v]) => ({ status, ...v }))

  const base = `/projects/${projectId}/cost-control`

  const navItems = [
    { href: `${base}/budget`,      label: 'Budget',       icon: DollarSign,  count: budgetItems.length,      meta: formatCurrency(totalBudget, projectCurrency) },
    { href: `${base}/commitments`, label: 'Commitments',  icon: FileText,    count: commitmentsItems.length, meta: formatCurrency(totalCommitments, projectCurrency) },
    { href: `${base}/actuals`,     label: 'Actual Costs', icon: ReceiptText, count: actualsItems.length,     meta: formatCurrency(totalActuals, projectCurrency) },
    { href: `${base}/forecasts`,   label: 'Forecasts',    icon: BarChart3,   count: forecastsRes.count ?? 0  },
    { href: `${base}/changes`,     label: 'Changes',      icon: RefreshCw,   count: changesItems.length,     meta: openChanges.length > 0 ? `${openChanges.length} open` : undefined },
    { href: `${base}/documents`,   label: 'Documents',    icon: FolderOpen },
  ]

  const kpiData = {
    totalBudget,
    totalActuals,
    totalCommitments,
    remaining,
    utilization,
    budgetCount: budgetItems.length,
    actualsCount: actualsItems.length,
    commitmentsCount: commitmentsItems.length,
    openChangesAmt,
    approvedAmt,
    openChangesCount: openChanges.length,
    approvedChangesCount: approvedChanges.length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cost Control</h1>
        <p className="text-sm text-gray-500 mt-1">Budget, commitments, actuals & forecasts</p>
      </div>

      {/* Module navigation */}
      <ModuleNav items={navItems} />

      {/* KPI cards + charts with shared USD portfolio toggle */}
      <CostControlKPIs
        projectCurrency={projectCurrency}
        usdRate={usdRate}
        project={kpiData}
        budgetByDiscipline={budgetByDiscipline}
        commitmentsByStatus={commitmentsByStatus}
        actualsByVendor={actualsByVendor}
      />
    </div>
  )
}
