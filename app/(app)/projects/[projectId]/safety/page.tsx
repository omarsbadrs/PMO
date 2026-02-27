import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Eye, ShieldAlert, CheckCircle } from 'lucide-react'

interface Props { params: Promise<{ projectId: string }> }

export default async function SafetyDashboard({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [incidents, observations] = await Promise.all([
    supabase.from('sf_incidents').select('severity, status').eq('project_id', projectId),
    supabase.from('sf_observations').select('status').eq('project_id', projectId),
  ])

  const ltiCount = incidents.data?.filter((i) => i.severity === 'lti' || i.severity === 'fatality').length ?? 0
  const openIncidents = incidents.data?.filter((i) => i.status === 'open').length ?? 0
  const openObservations = observations.data?.filter((o) => o.status === 'open').length ?? 0
  const totalIncidents = incidents.data?.length ?? 0

  const base = `/projects/${projectId}/safety`
  const stats = [
    { label: 'LTIs / Fatalities', value: String(ltiCount), icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Open Incidents', value: String(openIncidents), icon: ShieldAlert, color: 'text-orange-600' },
    { label: 'Open Observations', value: String(openObservations), icon: Eye, color: 'text-yellow-600' },
    { label: 'Total Incidents', value: String(totalIncidents), icon: CheckCircle, color: 'text-blue-600' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Safety</h1><p className="text-sm text-gray-500 mt-1">Incidents, observations & corrective actions</p></div>
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
        {[['incidents','Incidents'],['observations','Observations'],['documents','Documents']].map(([key, label]) => (
          <Button key={key} variant="outline" asChild><Link href={`${base}/${key}`}>{label}</Link></Button>
        ))}
      </div>
    </div>
  )
}
