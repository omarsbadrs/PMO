import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: project }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('id', projectId).single(),
  ])

  if (!profile) redirect('/login')
  if (profile.is_active === false) redirect('/login')
  if (!project) notFound()

  const isElevated =
    profile.is_global_admin ||
    profile.role === 'admin' ||
    profile.role === 'manager'

  // Elevated users see all modules; regular users see only their assigned ones
  let allowedModules: string[] | null = null  // null = all
  if (!isElevated) {
    const admin = createAdminClient()
    const { data: moduleRoles } = await admin
      .from('module_roles')
      .select('module_key')
      .eq('user_id', user.id)
      .eq('project_id', projectId)

    allowedModules = (moduleRoles ?? []).map((r) => DB_TO_SLUG[r.module_key] ?? r.module_key)
  }

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
