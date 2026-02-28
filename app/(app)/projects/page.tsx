import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, FolderOpen } from 'lucide-react'
import type { Project } from '@/types/app'

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin, role')
    .eq('id', user.id)
    .single()

  // Admins and managers see all projects (bypass RLS); regular users rely on RLS + project_memberships
  const isElevated = profile?.is_global_admin || profile?.role === 'admin' || profile?.role === 'manager'
  const projectClient = isElevated ? createAdminClient() : supabase

  const { data: projects } = await projectClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">Select a project to start working</p>
        </div>
        {profile?.is_global_admin && (
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Link>
          </Button>
        )}
      </div>

      {!projects?.length ? (
        <div className="text-center py-16 text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No projects yet</p>
          {profile?.is_global_admin && (
            <p className="text-sm mt-1">
              <Link href="/admin/projects/new" className="text-blue-600 hover:underline">
                Create your first project
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: Project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2">
                      {project.name}
                    </CardTitle>
                    <Badge className={`text-xs shrink-0 ${statusColor[project.status] ?? ''}`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{project.code}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {project.start_date} → {project.end_date ?? 'TBD'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
