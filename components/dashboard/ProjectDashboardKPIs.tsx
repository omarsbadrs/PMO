'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Calendar, ShieldAlert, CheckSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import ProjectCharts from '@/components/dashboard/ProjectCharts'
import type { CostData, PlanningData, SafetyData, QualityData } from '@/types/dashboard'

interface Props {
  ccData: CostData | null
  plData: PlanningData | null
  sfData: SafetyData | null
  qlData: QualityData | null
  projectCurrency: string
  usdRate: number
}

export default function ProjectDashboardKPIs({
  ccData, plData, sfData, qlData, projectCurrency, usdRate,
}: Props) {
  const [showUsd, setShowUsd] = useState(false)

  const currency = showUsd ? 'USD' : projectCurrency
  const convert = (n: number) => (showUsd && usdRate > 0 ? n / usdRate : n)
  const fmt = (n: number) => formatCurrency(convert(n), currency)

  // Transform ccData for charts when in USD mode
  const displayCcData: CostData | null = ccData && showUsd ? {
    ...ccData,
    currency: 'USD',
    totalBudget:      convert(ccData.totalBudget),
    totalActuals:     convert(ccData.totalActuals),
    totalCommitments: convert(ccData.totalCommitments),
  } : ccData

  const kpis = [
    ccData && {
      label: 'Total Budget',
      value: fmt(ccData.totalBudget),
      sub: `${fmt(ccData.totalActuals)} spent`,
      icon: DollarSign, iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
    },
    plData && {
      label: 'Avg. Progress',
      value: `${Math.round(plData.avgProgress)}%`,
      sub: `${plData.totalActivities} activities · ${plData.openMilestones} open milestones`,
      icon: Calendar, iconBg: 'bg-green-50', iconColor: 'text-green-600',
    },
    sfData && {
      label: 'Total Incidents',
      value: String(sfData.totalIncidents),
      sub: `${sfData.openObservations} open observations`,
      icon: ShieldAlert, iconBg: 'bg-orange-50', iconColor: 'text-orange-600',
    },
    qlData && {
      label: 'Open NCRs',
      value: String(qlData.openNcr),
      sub: `${qlData.openPunch} open punch · ${qlData.totalInspections} inspections`,
      icon: CheckSquare, iconBg: 'bg-red-50', iconColor: 'text-red-600',
    },
  ].filter(Boolean) as { label: string; value: string; sub: string; icon: React.ElementType; iconBg: string; iconColor: string }[]

  return (
    <div className="space-y-5">
      {/* Currency toggle — only show when project has a non-USD currency */}
      {ccData && (
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
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${iconBg} shrink-0 ml-3`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <ProjectCharts
        ccData={displayCcData}
        plData={plData}
        sfData={sfData}
        qlData={qlData}
        currency={currency}
      />
    </div>
  )
}
