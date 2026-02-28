import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProfile } from '@/types/app'

// cache() deduplicates calls within a single React render (one HTTP request).
// All layouts and pages that call these functions share the same result.

const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
})

const getSessionProfile = cache(async (userId: string) => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data ?? null
})

export async function getUser() {
  return getSessionUser()
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getSessionUser()
  if (!user) return null
  return getSessionProfile(user.id) as Promise<UserProfile | null>
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function requireGlobalAdmin() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const profile = await getSessionProfile(user.id)
  if (!profile?.is_global_admin && profile?.role !== 'admin') redirect('/projects')
  return user
}

export async function getUserModuleRole(
  projectId: string,
  moduleKey: string
): Promise<string | null> {
  const user = await getSessionUser()       // cached — no extra DB call
  if (!user) return null

  const profile = await getSessionProfile(user.id)  // cached — no extra DB call
  if (!profile) return null

  // Disabled users have no access
  if (profile.is_active === false) return null

  // Admin and Manager have full access to all modules
  if (profile.is_global_admin || profile.role === 'admin' || profile.role === 'manager') {
    return 'GLOBAL_ADMIN'
  }

  // Regular users: check assigned module roles
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
