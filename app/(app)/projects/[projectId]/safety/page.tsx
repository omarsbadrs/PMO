import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleRole } from '@/lib/auth/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Eye, ShieldAlert, CheckCircle, FolderOpen } from 'lucide-react'
import ModuleNav from '@/components/dashboard/ModuleNav'
import SafetyCharts from '@/components/dashboard/SafetyCharts'

interface Props { params: Promise<{ projectId: string }> }

export default async function SafetyDashboard({ params }: Props) {
  const { projectId } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'safety')
  if (!role) redirect(`/projects/${projectId}`)

  const [incidentsRes, observationsRes] = await Promise.all([
    db.from('sf_incidents').select('severity, status').eq('project_id', projectId),
    db.from('sf_observations').select('type, status').eq('project_id', projectId),
  ])

  const incidents    = incidentsRes.data ?? []
  const observations = observationsRes.data ?? []

  // ── KPI calculations ──────────────────────────────────────────────
  const totalIncidents   = incidents.length
  const openIncidents    = incidents.filter(i => i.status === 'open').length
  const closedIncidents  = incidents.filter(i => ['closed', 'resolved'].includes(i.status ?? '')).length

  const ltiCount         = incidents.filter(i => ['lti', 'fatality'].includes(i.severity ?? '')).length
  const medicalCount     = incidents.filter(i => i.severity === 'medical_treatment').length
  const firstAidCount    = incidents.filter(i => i.severity === 'first_aid').length
  const nearMissCount    = incidents.filter(i => i.severity === 'near_miss').length

  const totalObservations = observations.length
  const openObservations  = observations.filter(o => o.status === 'open').length
  const closedObservations = observations.filter(o => ['closed', 'resolved'].includes(o.status ?? '')).length

  // ── Chart data ────────────────────────────────────────────────────
  const sevMap: Record<string, number> = {}
  incidents.forEach(i => {
    const s = i.severity ?? 'unknown'
    sevMap[s] = (sevMap[s] ?? 0) + 1
  })
  const incidentsBySeverity = Object.entries(sevMap).map(([severity, count]) => ({ severity, count }))

  const typeMap: Record<string, { open: number; closed: number }> = {}
  observations.forEach(o => {
    const t = o.type?.trim() || 'Other'
    if (!typeMap[t]) typeMap[t] = { open: 0, closed: 0 }
    if (o.status === 'open') typeMap[t].open++
    else typeMap[t].closed++
  })
  const observationsByType = Object.entries(typeMap).map(([type, v]) => ({ type, ...v }))

  const base = `/projects/${projectId}/safety`

  const navItems = [
    { href: `${base}/incidents`,    label: 'Incidents',     icon: ShieldAlert, count: totalIncidents,    meta: openIncidents > 0 ? `${openIncidents} open` : 'All closed' },
    { href: `${base}/observations`, label: 'Observations',  icon: Eye,         count: totalObservations, meta: openObservations > 0 ? `${openObservations} open` : undefined },
    { href: `${base}/documents`,    label: 'Documents',     icon: FolderOpen },
  ]

  const kpis = [
    { label: 'LTIs / Fatalities', value: String(ltiCount),          sub: ltiCount > 0 ? 'Requires immediate review' : 'No LTIs recorded',  icon: AlertTriangle, iconBg: ltiCount > 0 ? 'bg-red-50' : 'bg-gray-50',    iconColor: ltiCount > 0 ? 'text-red-600' : 'text-gray-400'    },
    { label: 'Open Incidents',    value: String(openIncidents),      sub: `${closedIncidents} closed · ${totalIncidents} total`,            icon: ShieldAlert,   iconBg: 'bg-orange-50', iconColor: 'text-orange-600'   },
    { label: 'Open Observations', value: String(openObservations),   sub: `${closedObservations} closed · ${totalObservations} total`,      icon: Eye,           iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600'   },
    { label: 'Near Misses',       value: String(nearMissCount),      sub: `${firstAidCount} first aid · ${medicalCount} medical`,           icon: CheckCircle,   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600'     },
  ]

  const secondaryKpis = [
    { label: 'Near Miss',          value: String(nearMissCount),   sub: 'Incidents' },
    { label: 'First Aid',          value: String(firstAidCount),   sub: 'Incidents' },
    { label: 'Medical Treatment',  value: String(medicalCount),    sub: 'Incidents' },
    { label: 'LTI / Fatality',     value: String(ltiCount),        sub: ltiCount > 0 ? '⚠ Serious' : 'None recorded' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Safety</h1>
        <p className="text-sm text-gray-500 mt-1">Incidents, observations & corrective actions</p>
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

      {/* Severity breakdown */}
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
      <SafetyCharts
        incidentsBySeverity={incidentsBySeverity}
        observationsByType={observationsByType}
        openIncidents={openIncidents}
        closedIncidents={closedIncidents}
      />
    </div>
  )
}
