import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, XCircle, List, AlertCircle } from 'lucide-react'

interface Props { params: Promise<{ projectId: string }> }

export default async function QualityDashboard({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [inspections, ncrs, punch] = await Promise.all([
    supabase.from('ql_inspections').select('status').eq('project_id', projectId),
    supabase.from('ql_ncr').select('status, severity').eq('project_id', projectId),
    supabase.from('ql_punch').select('status, category').eq('project_id', projectId),
  ])

  const openNcrs = ncrs.data?.filter((n) => n.status === 'open').length ?? 0
  const openPunch = punch.data?.filter((p) => p.status === 'open').length ?? 0
  const passedInspections = inspections.data?.filter((i) => i.status === 'completed').length ?? 0
  const criticalNcrs = ncrs.data?.filter((n) => n.severity === 'critical' && n.status === 'open').length ?? 0

  const base = `/projects/${projectId}/quality`
  const stats = [
    { label: 'Open NCRs', value: String(openNcrs), icon: XCircle, color: 'text-red-600' },
    { label: 'Open Punch Items', value: String(openPunch), icon: List, color: 'text-orange-600' },
    { label: 'Inspections Passed', value: String(passedInspections), icon: ClipboardCheck, color: 'text-green-600' },
    { label: 'Critical NCRs', value: String(criticalNcrs), icon: AlertCircle, color: 'text-red-800' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Quality</h1><p className="text-sm text-gray-500 mt-1">Inspections, NCRs & punch list</p></div>
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
        {[['inspections','Inspections'],['ncr','NCRs'],['punch','Punch List'],['documents','Documents']].map(([key, label]) => (
          <Button key={key} variant="outline" asChild><Link href={`${base}/${key}`}>{label}</Link></Button>
        ))}
      </div>
    </div>
  )
}
