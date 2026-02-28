import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/types/app'
import UserDetailClient from './UserDetailClient'
import UserInfoCard from './UserInfoCard'

interface Props { params: Promise<{ id: string }> }

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params
  await requireGlobalAdmin()
  const admin = createAdminClient()

  const [{ data: profile }, { data: moduleRoles }, { data: projects }] = await Promise.all([
    admin.from('user_profiles').select('*').eq('id', id).single(),
    admin.from('module_roles').select('project_id, module_key').eq('user_id', id),
    admin.from('projects').select('id, name, code').order('name'),
  ])

  if (!profile) return <p className="text-sm text-gray-500">User not found.</p>

  const u = profile as UserProfile

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {(u.display_name || u.email).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{u.display_name}</h1>
            <p className="text-sm text-gray-500">{u.job_title ?? 'No job title'}</p>
          </div>
        </div>
        <Badge className={`${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} hover:bg-opacity-80 px-3`}>
          {u.is_active !== false ? 'Active' : 'Disabled'}
        </Badge>
      </div>

      {/* User Information Card — editable */}
      <UserInfoCard
        userId={id}
        display_name={u.display_name}
        email={u.email}
        department={u.department}
        job_title={u.job_title}
        tier={u.tier}
        role={u.role ?? 'user'}
      />

      {/* Dynamic section: Quick Actions + Project Assignments */}
      <UserDetailClient
        userId={id}
        currentRole={u.role ?? 'user'}
        isActive={u.is_active !== false}
        projects={projects ?? []}
        moduleRoles={moduleRoles ?? []}
      />
    </div>
  )
}
