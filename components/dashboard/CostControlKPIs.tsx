'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, TrendingUp, FileText, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import CostControlCharts, {
  type BudgetByDiscipline,
  type CommitmentByStatus,
  type ActualByVendor,
} from '@/components/dashboard/CostControlCharts'

interface KpiSet {
  totalBudget: number
  totalActuals: number
  totalCommitments: number
  remaining: number
  utilization: number
  budgetCount: number
  actualsCount: number
  commitmentsCount: number
  openChangesAmt: number
  approvedAmt: number
  openChangesCount: number
  approvedChangesCount: number
}

interface Props {
  projectCurrency: string
  usdRate: number
  project: KpiSet
  budgetByDiscipline: BudgetByDiscipline[]
  commitmentsByStatus: CommitmentByStatus[]
  actualsByVendor: ActualByVendor[]
}

function toUsd(amount: number, usdRate: number) {
  return usdRate > 0 ? amount / usdRate : amount
}

export default function CostControlKPIs({
  projectCurrency, usdRate, project,
  budgetByDiscipline, commitmentsByStatus, actualsByVendor,
}: Props) {
  const [showUsd, setShowUsd] = useState(false)

  const currency = showUsd ? 'USD' : projectCurrency
  const conv = (n: number) => showUsd ? toUsd(n, usdRate) : n
  const fmt = (n: number) => formatCurrency(conv(n), currency)

  const remaining = conv(project.remaining)

  const kpis = [
    {
      label: 'Total Budget',
      value: fmt(project.totalBudget),
      sub: `${project.budgetCount} line items`,
      iconBg: 'bg-blue-50', iconColor: 'text-blue-600', icon: DollarSign,
    },
    {
      label: 'Actual Costs',
      value: fmt(project.totalActuals),
      sub: `${project.utilization.toFixed(1)}% of budget utilised`,
      iconBg: 'bg-green-50', iconColor: 'text-green-600', icon: TrendingUp,
    },
    {
      label: 'Commitments',
      value: fmt(project.totalCommitments),
      sub: `${project.commitmentsCount} purchase orders`,
      iconBg: 'bg-orange-50', iconColor: 'text-orange-600', icon: FileText,
    },
    {
      label: 'Remaining Budget',
      value: fmt(project.remaining),
      sub: remaining < 0 ? 'Over budget' : `${(Math.abs(project.remaining) / (project.totalBudget || 1) * 100).toFixed(1)}% remaining`,
      iconBg: project.remaining < 0 ? 'bg-red-50' : 'bg-gray-50',
      iconColor: project.remaining < 0 ? 'text-red-600' : 'text-gray-500',
      icon: AlertTriangle,
    },
  ]

  const secondaryKpis = [
    { label: 'Total POs',        value: String(project.commitmentsCount),    sub: fmt(project.totalCommitments) },
    { label: 'Total Invoices',   value: String(project.actualsCount),         sub: fmt(project.totalActuals)     },
    { label: 'Open Changes',     value: String(project.openChangesCount),     sub: fmt(project.openChangesAmt)   },
    { label: 'Approved Changes', value: String(project.approvedChangesCount), sub: fmt(project.approvedAmt)      },
  ]

  // Convert chart data when in USD mode
  const chartBudgetByDiscipline = showUsd
    ? budgetByDiscipline.map(d => ({ ...d, budget: conv(d.budget), actuals: conv(d.actuals) }))
    : budgetByDiscipline

  const chartActualsByVendor = showUsd
    ? actualsByVendor.map(d => ({ ...d, amount: conv(d.amount) }))
    : actualsByVendor

  const chartCommitmentsByStatus = showUsd
    ? commitmentsByStatus.map(d => ({ ...d, amount: conv(d.amount) }))
    : commitmentsByStatus

  return (
    <div className="space-y-4">
      {/* Currency toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUsd((v) => !v)}
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            showUsd
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <DollarSign className="w-3 h-3" />
          {showUsd ? 'USD Portfolio View' : `${projectCurrency} Project View`}
        </button>
      </div>

      {/* Primary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium">{label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${iconBg} shrink-0 ml-3`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryKpis.map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts — react to the same toggle */}
      <CostControlCharts
        budgetByDiscipline={chartBudgetByDiscipline}
        commitmentsByStatus={chartCommitmentsByStatus}
        actualsByVendor={chartActualsByVendor}
        currency={currency}
      />
    </div>
  )
}
