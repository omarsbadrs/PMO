import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const MODULE_ORDER = ['cost-control', 'planning', 'safety', 'quality']
const DB_TO_SLUG: Record<string, string> = {
  cost_control: 'cost-control',
  planning:     'planning',
  safety:       'safety',
  quality:      'quality',
}

interface Props { params: Promise<{ projectId: string }> }

export default async function ProjectRoot({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin, role')
    .eq('id', user.id)
    .single()

  const isElevated =
    profile?.is_global_admin ||
    profile?.role === 'admin' ||
    profile?.role === 'manager'

  if (isElevated) {
    redirect(`/projects/${projectId}/cost-control`)
  }

  // Regular user — redirect to their first assigned module
  const admin = createAdminClient()
  const { data: moduleRoles } = await admin
    .from('module_roles')
    .select('module_key')
    .eq('user_id', user.id)
    .eq('project_id', projectId)

  const slugs = (moduleRoles ?? []).map((r) => DB_TO_SLUG[r.module_key] ?? r.module_key)
  const first = MODULE_ORDER.find((m) => slugs.includes(m))

  if (first) {
    redirect(`/projects/${projectId}/${first}`)
  }

  // No modules assigned — go back to projects list
  redirect('/projects')
}
