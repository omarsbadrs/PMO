import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleRole } from '@/lib/auth/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, CheckSquare, TrendingUp, Flag, Activity, FolderOpen, LayoutList } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import ModuleNav from '@/components/dashboard/ModuleNav'
import PlanningCharts from '@/components/dashboard/PlanningCharts'

interface Props { params: Promise<{ projectId: string }> }

export default async function PlanningDashboard({ params }: Props) {
  const { projectId } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserModuleRole(projectId, 'planning')
  if (!role) redirect(`/projects/${projectId}`)

  const [activitiesRes, milestonesRes, schedulesRes] = await Promise.all([
    db.from('pl_activities').select('status, percent_complete').eq('project_id', projectId),
    db.from('pl_milestones').select('name, planned_date, status, is_key_milestone').eq('project_id', projectId).order('planned_date'),
    db.from('pl_schedules').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
  ])

  const activities  = activitiesRes.data ?? []
  const milestones  = milestonesRes.data ?? []

  // ── KPI calculations ──────────────────────────────────────────────
  const totalActivities     = activities.length
  const completedActivities = activities.filter(a => ['completed', 'complete'].includes(a.status ?? '')).length
  const inProgressActivities = activities.filter(a => a.status === 'in_progress').length
  const delayedActivities   = activities.filter(a => a.status === 'delayed').length
  const notStarted          = activities.filter(a => a.status === 'not_started').length

  const avgProgress = totalActivities > 0
    ? activities.reduce((s, a) => s + (a.percent_complete ?? 0), 0) / totalActivities
    : 0

  const totalMilestones    = milestones.length
  const completedMilestones = milestones.filter(m => ['completed', 'achieved'].includes(m.status ?? '')).length
  const openMilestones      = milestones.filter(m => !['completed', 'achieved'].includes(m.status ?? ''))
  const keyMilestonesOpen   = openMilestones.filter(m => m.is_key_milestone).length

  // ── Chart data ────────────────────────────────────────────────────
  const statusMap: Record<string, number> = {}
  activities.forEach(a => {
    const s = a.status ?? 'unknown'
    statusMap[s] = (statusMap[s] ?? 0) + 1
  })
  const activitiesByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  const upcomingMilestones = openMilestones.slice(0, 8)

  const base = `/projects/${projectId}/planning`

  const navItems = [
    { href: `${base}/schedules`,  label: 'Schedules',  icon: Calendar,    count: schedulesRes.count ?? 0  },
    { href: `${base}/activities`, label: 'Activities', icon: Activity,    count: totalActivities,          meta: `${Math.round(avgProgress)}% avg` },
    { href: `${base}/milestones`, label: 'Milestones', icon: Flag,        count: totalMilestones,          meta: `${openMilestones.length} open` },
    { href: `${base}/documents`,  label: 'Documents',  icon: FolderOpen },
  ]

  const kpis = [
    { label: 'Overall Progress',    value: `${Math.round(avgProgress)}%`,           sub: `Average across all activities`,         icon: TrendingUp,   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600'   },
    { label: 'Activities Complete', value: `${completedActivities}/${totalActivities}`, sub: `${inProgressActivities} in progress`,  icon: CheckSquare,  iconBg: 'bg-green-50',  iconColor: 'text-green-600'  },
    { label: 'Open Milestones',     value: String(openMilestones.length),            sub: `${keyMilestonesOpen} key milestones`,    icon: Flag,         iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { label: 'Milestones Done',     value: `${completedMilestones}/${totalMilestones}`, sub: formatDate(openMilestones[0]?.planned_date) + ' next', icon: Calendar, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  ]

  const secondaryKpis = [
    { label: 'Not Started',  value: String(notStarted),           sub: `${totalActivities > 0 ? ((notStarted / totalActivities) * 100).toFixed(0) : 0}% of activities` },
    { label: 'In Progress',  value: String(inProgressActivities), sub: `${totalActivities > 0 ? ((inProgressActivities / totalActivities) * 100).toFixed(0) : 0}% of activities` },
    { label: 'Completed',    value: String(completedActivities),  sub: `${totalActivities > 0 ? ((completedActivities / totalActivities) * 100).toFixed(0) : 0}% of activities` },
    { label: 'Delayed',      value: String(delayedActivities),    sub: delayedActivities > 0 ? 'Needs attention' : 'No delays' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
        <p className="text-sm text-gray-500 mt-1">Schedules, activities, progress & milestones</p>
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
      <PlanningCharts
        activitiesByStatus={activitiesByStatus}
        upcomingMilestones={upcomingMilestones}
        totalActivities={totalActivities}
        avgProgress={avgProgress}
      />
    </div>
  )
}
