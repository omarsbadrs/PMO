import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Check global admin first
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (profile?.is_global_admin) return 'GLOBAL_ADMIN'

  const { data: role } = await supabase
    .from('module_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .eq('module_key', moduleKey)
    .single()

  return role?.role ?? null
}
