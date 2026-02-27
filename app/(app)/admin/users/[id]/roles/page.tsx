import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import RolesManager from './RolesManager'

interface Props { params: Promise<{ id: string }> }

export default async function UserRolesPage({ params }: Props) {
  const { id } = await params
  await requireGlobalAdmin()
  const admin = createAdminClient()

  const [{ data: profile }, { data: projects }, { data: existingRoles }] = await Promise.all([
    admin.from('user_profiles').select('id, display_name, email').eq('id', id).single(),
    admin.from('projects').select('id, name, code').order('name'),
    admin.from('module_roles').select('*').eq('user_id', id),
  ])

  if (!profile) return <p className="text-sm text-gray-500">User not found.</p>

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Manage Roles — {profile.display_name}</h1>
        <p className="text-sm text-gray-500">{profile.email}</p>
      </div>
      <RolesManager
        userId={id}
        projects={projects ?? []}
        existingRoles={existingRoles ?? []}
      />
    </div>
  )
}
