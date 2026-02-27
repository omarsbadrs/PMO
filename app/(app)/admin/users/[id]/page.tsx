import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props { params: Promise<{ id: string }> }

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params
  await requireGlobalAdmin()
  const admin = createAdminClient()

  const [{ data: profile }, { data: roles }] = await Promise.all([
    admin.from('user_profiles').select('*').eq('id', id).single(),
    admin
      .from('module_roles')
      .select('*, projects(name, code)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) return <p className="text-sm text-gray-500">User not found.</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
        <div className="flex gap-2">
          {profile.is_global_admin && <Badge>Global Admin</Badge>}
          <Button asChild>
            <Link href={`/admin/users/${id}/roles`}>Manage Roles</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Module Roles</CardTitle></CardHeader>
        <CardContent>
          {!roles?.length ? (
            <p className="text-sm text-gray-500">No module roles assigned.</p>
          ) : (
            <div className="divide-y">
              {roles.map((r) => (
                <div key={r.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">
                      {(r.projects as { name: string; code: string } | null)?.name ?? r.project_id}
                    </span>
                    <span className="text-gray-400 text-xs ml-2">
                      {(r.projects as { name: string; code: string } | null)?.code}
                    </span>
                    <p className="text-xs text-gray-500 capitalize">{r.module_key.replace('_', ' ')}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{r.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
