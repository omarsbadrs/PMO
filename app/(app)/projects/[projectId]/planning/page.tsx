import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckSquare, TrendingUp, Flag } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

interface Props { params: Promise<{ projectId: string }> }

export default async function PlanningDashboard({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [milestones, activities, progress] = await Promise.all([
    supabase.from('pl_milestones').select('status, planned_date, name, is_key_milestone').eq('project_id', projectId).order('planned_date'),
    supabase.from('pl_activities').select('percent_complete, status').eq('project_id', projectId),
    supabase.from('pl_progress').select('percent_complete').eq('project_id', projectId).order('report_date', { ascending: false }).limit(1).single(),
  ])

  const totalActivities = activities.data?.length ?? 0
  const completedActivities = activities.data?.filter((a) => a.status === 'completed').length ?? 0
  const overallProgress = totalActivities > 0
    ? (activities.data?.reduce((s, a) => s + (a.percent_complete ?? 0), 0) ?? 0) / totalActivities
    : 0
  const openMilestones = milestones.data?.filter((m) => m.status === 'pending').length ?? 0
  const nextMilestone = milestones.data?.find((m) => m.status === 'pending')

  const base = `/projects/${projectId}/planning`
  const stats = [
    { label: 'Overall Progress', value: `${overallProgress.toFixed(0)}%`, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Activities', value: `${completedActivities}/${totalActivities}`, icon: CheckSquare, color: 'text-green-600' },
    { label: 'Open Milestones', value: String(openMilestones), icon: Flag, color: 'text-orange-600' },
    { label: 'Next Milestone', value: nextMilestone ? formatDate(nextMilestone.planned_date) : '—', icon: Calendar, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Planning</h1><p className="text-sm text-gray-500 mt-1">Schedules, activities, progress & milestones</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent><p className="text-xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[['schedules','Schedules'],['activities','Activities'],['milestones','Milestones'],['documents','Documents']].map(([key, label]) => (
          <Button key={key} variant="outline" asChild><Link href={`${base}/${key}`}>{label}</Link></Button>
        ))}
      </div>
      {nextMilestone && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Next Key Milestone</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{nextMilestone.name}</p>
            <p className="text-sm text-gray-500">{formatDate(nextMilestone.planned_date)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
