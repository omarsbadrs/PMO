import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleRole } from '@/lib/auth/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardCheck, XCircle, List, AlertCircle, FolderOpen } from 'lucide-react'
import ModuleNav from '@/components/dashboard/ModuleNav'
import QualityCharts from '@/components/dashboard/QualityCharts'

interface Props { params: Promise<{ projectId: string }> }

export default async function QualityDashboard({ params }: Props) {
  const { projectId } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'quality')
  if (!role) redirect(`/projects/${projectId}`)

  const [inspectionsRes, ncrRes, punchRes] = await Promise.all([
    db.from('ql_inspections').select('status, result, type').eq('project_id', projectId),
    db.from('ql_ncr').select('status, severity').eq('project_id', projectId),
    db.from('ql_punch').select('status, category').eq('project_id', projectId),
  ])

  const inspections = inspectionsRes.data ?? []
  const ncrs        = ncrRes.data ?? []
  const punch       = punchRes.data ?? []

  // ── KPI calculations ──────────────────────────────────────────────
  const totalInspections  = inspections.length
  const passedInspections = inspections.filter(i => ['pass', 'passed', 'completed'].includes(i.result?.toLowerCase() ?? '')).length
  const failedInspections = inspections.filter(i => ['fail', 'failed'].includes(i.result?.toLowerCase() ?? '')).length
  const pendingInspections = inspections.filter(i => ['scheduled', 'in_progress', 'pending'].includes(i.status ?? '')).length
  const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0

  const totalNcr    = ncrs.length
  const openNcr     = ncrs.filter(n => n.status === 'open').length
  const closedNcr   = ncrs.filter(n => ['closed', 'resolved'].includes(n.status ?? '')).length
  const criticalNcr = ncrs.filter(n => n.severity === 'critical' && n.status === 'open').length

  const totalPunch  = punch.length
  const openPunch   = punch.filter(p => p.status === 'open').length
  const closedPunch = punch.filter(p => ['closed', 'resolved', 'completed'].includes(p.status ?? '')).length

  // ── Chart data ────────────────────────────────────────────────────
  const resultMap: Record<string, number> = {}
  inspections.forEach(i => {
    const r = i.result?.toLowerCase() || 'pending'
    resultMap[r] = (resultMap[r] ?? 0) + 1
  })
  const inspectionsByResult = Object.entries(resultMap).map(([result, count]) => ({ result, count }))

  const ncrSevMap: Record<string, number> = {}
  ncrs.forEach(n => {
    const s = n.severity?.toLowerCase() || 'unclassified'
    ncrSevMap[s] = (ncrSevMap[s] ?? 0) + 1
  })
  const ncrBySeverity = Object.entries(ncrSevMap).map(([severity, count]) => ({ severity, count }))

  const punchCatMap: Record<string, { open: number; closed: number }> = {}
  punch.forEach(p => {
    const c = p.category?.trim() || 'Other'
    if (!punchCatMap[c]) punchCatMap[c] = { open: 0, closed: 0 }
    if (p.status === 'open') punchCatMap[c].open++
    else punchCatMap[c].closed++
  })
  const punchByCategory = Object.entries(punchCatMap).map(([category, v]) => ({ category, ...v }))

  const base = `/projects/${projectId}/quality`

  const navItems = [
    { href: `${base}/inspections`, label: 'Inspections', icon: ClipboardCheck, count: totalInspections, meta: `${Math.round(passRate)}% pass` },
    { href: `${base}/ncr`,        label: 'NCRs',        icon: XCircle,        count: totalNcr,         meta: openNcr > 0 ? `${openNcr} open` : undefined },
    { href: `${base}/punch`,      label: 'Punch List',  icon: List,           count: totalPunch,        meta: openPunch > 0 ? `${openPunch} open` : undefined },
    { href: `${base}/documents`,  label: 'Documents',   icon: FolderOpen },
  ]

  const kpis = [
    { label: 'Inspection Pass Rate', value: `${Math.round(passRate)}%`,   sub: `${passedInspections} passed · ${failedInspections} failed · ${pendingInspections} pending`, icon: ClipboardCheck, iconBg: passRate >= 80 ? 'bg-green-50' : passRate >= 60 ? 'bg-yellow-50' : 'bg-red-50', iconColor: passRate >= 80 ? 'text-green-600' : passRate >= 60 ? 'text-yellow-600' : 'text-red-600' },
    { label: 'Open NCRs',            value: String(openNcr),              sub: `${closedNcr} closed · ${totalNcr} total`,                                                    icon: XCircle,        iconBg: openNcr > 0 ? 'bg-red-50' : 'bg-gray-50',   iconColor: openNcr > 0 ? 'text-red-600' : 'text-gray-400'     },
    { label: 'Open Punch Items',     value: String(openPunch),            sub: `${closedPunch} closed · ${totalPunch} total`,                                                 icon: List,           iconBg: 'bg-orange-50', iconColor: 'text-orange-600'  },
    { label: 'Critical NCRs',        value: String(criticalNcr),          sub: criticalNcr > 0 ? 'Immediate action required' : 'No critical NCRs open',                      icon: AlertCircle,    iconBg: criticalNcr > 0 ? 'bg-red-50' : 'bg-gray-50', iconColor: criticalNcr > 0 ? 'text-red-700' : 'text-gray-400' },
  ]

  const secondaryKpis = [
    { label: 'Total Inspections', value: String(totalInspections), sub: `${pendingInspections} pending` },
    { label: 'Passed',            value: String(passedInspections), sub: `${Math.round(passRate)}% of all` },
    { label: 'Failed',            value: String(failedInspections), sub: failedInspections > 0 ? 'Needs review' : 'None' },
    { label: 'Total NCRs',        value: String(totalNcr),          sub: `${closedNcr} resolved` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quality</h1>
        <p className="text-sm text-gray-500 mt-1">Inspections, NCRs & punch list</p>
      </div>

      {/* Module navigation */}
      <ModuleNav items={navItems} />

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

      {/* Charts */}
      <QualityCharts
        inspectionsByResult={inspectionsByResult}
        ncrBySeverity={ncrBySeverity}
        punchByCategory={punchByCategory}
        passRate={passRate}
        totalInspections={totalInspections}
      />
    </div>
  )
}
