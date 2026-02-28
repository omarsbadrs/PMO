import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/auth/helpers'
import AppSidebar from '@/components/layout/AppSidebar'
import Header from '@/components/layout/Header'
import type { UserProfile } from '@/types/app'

// DB key → URL slug
const DB_TO_SLUG: Record<string, string> = {
  cost_control: 'cost-control',
  planning:     'planning',
  safety:       'safety',
  quality:      'quality',
}

interface Props {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params

  // Both use cache() — zero extra DB calls if already fetched this request
  const user    = await getUser()
  const profile = await getUserProfile()

  if (!user || !profile) redirect('/login')
  if (profile.is_active === false) redirect('/login')

  const isElevated =
    profile.is_global_admin ||
    profile.role === 'admin' ||
    profile.role === 'manager'

  const admin = createAdminClient()

  // Fetch project + (for regular users) allowed module keys in parallel
  const [{ data: project }, moduleRolesResult] = await Promise.all([
    admin.from('projects').select('id, name, code').eq('id', projectId).single(),
    isElevated
      ? Promise.resolve({ data: null })
      : admin
          .from('module_roles')
          .select('module_key')
          .eq('user_id', user.id)
          .eq('project_id', projectId),
  ])

  if (!project) notFound()

  const allowedModules: string[] | null = isElevated
    ? null
    : (moduleRolesResult.data ?? []).map((r) => DB_TO_SLUG[r.module_key] ?? r.module_key)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar
        projectId={projectId}
        isGlobalAdmin={profile.is_global_admin || profile.role === 'admin'}
        allowedModules={allowedModules}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={profile as UserProfile} title={project.name} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
