import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProfile } from '@/types/app'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireGlobalAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_global_admin) redirect('/projects')
  return user
}

export async function getUserModuleRole(
  projectId: string,
  moduleKey: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin, role, is_active')
    .eq('id', user.id)
    .single()

  // Disabled users have no access
  if (profile?.is_active === false) return null

  // Admin and Manager have full access to all modules
  if (profile?.is_global_admin || profile?.role === 'admin' || profile?.role === 'manager') {
    return 'GLOBAL_ADMIN'
  }

  // Regular users: check assigned module roles (use admin client to bypass any RLS issues)
  const admin = createAdminClient()
  const { data: role } = await admin
    .from('module_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .eq('module_key', moduleKey)
    .single()

  return role?.role ?? null
}
