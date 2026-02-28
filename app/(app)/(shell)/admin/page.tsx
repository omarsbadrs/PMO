import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Users, Activity, Settings } from 'lucide-react'

export default async function AdminPage() {
  await requireGlobalAdmin()
  const supabase = await createClient()

  const [projects, users, logs] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Projects', value: projects.count ?? 0, icon: FolderOpen, href: '/admin/projects' },
    { label: 'Users', value: users.count ?? 0, icon: Users, href: '/admin/users' },
    { label: 'Audit Logs', value: logs.count ?? 0, icon: Activity, href: '/admin/audit-logs' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Global administration — projects, users, roles</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
                <Icon className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Button asChild><Link href="/admin/projects/new">Create Project</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/users/invite">Invite User</Link></Button>
      </div>
    </div>
  )
}
