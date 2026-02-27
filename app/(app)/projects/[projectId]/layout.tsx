import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppSidebar from '@/components/layout/AppSidebar'
import Header from '@/components/layout/Header'
import type { UserProfile } from '@/types/app'

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
  if (!project) notFound()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar
        projectId={projectId}
        isGlobalAdmin={profile.is_global_admin}
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
