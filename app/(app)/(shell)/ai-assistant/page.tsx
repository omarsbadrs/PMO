import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AiChatInterface from '@/components/ai-assistant/ChatInterface'

export default async function AiAssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin, role')
    .eq('id', user.id)
    .single()

  const isElevated = profile?.is_global_admin || profile?.role === 'admin' || profile?.role === 'manager'
  const admin = createAdminClient()

  let projects: { id: string; name: string; code: string }[] = []

  if (isElevated) {
    // Admins see all projects regardless of status
    const { data } = await admin
      .from('projects')
      .select('id, name, code')
      .order('name')
    projects = data ?? []
  } else {
    // Regular users: collect project IDs from both membership AND module_roles
    // (module_roles can exist without a corresponding membership row)
    const [memberships, moduleRoles] = await Promise.all([
      admin.from('project_memberships').select('project_id').eq('user_id', user.id).eq('is_active', true),
      admin.from('module_roles').select('project_id').eq('user_id', user.id),
    ])
    const ids = [...new Set([
      ...(memberships.data ?? []).map((m) => m.project_id),
      ...(moduleRoles.data ?? []).map((r) => r.project_id),
    ])]

    if (ids.length > 0) {
      const { data } = await admin
        .from('projects')
        .select('id, name, code')
        .in('id', ids)
        .order('name')
      projects = data ?? []
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">Ask questions about your projects using natural language</p>
      </div>
      <AiChatInterface projects={projects} />
    </div>
  )
}
