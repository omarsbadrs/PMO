import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles').select('role, is_global_admin').eq('id', user.id).single()
  if (!profile?.is_global_admin && profile?.role !== 'admin') return null
  return user
}

// POST /api/admin/users — create user with email + password
export async function POST(req: NextRequest) {
  const caller = await assertAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, display_name, role, job_title, modules } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'email and password are required' }, { status: 400 })

  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: display_name || email.split('@')[0] },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const userId = authData.user.id

  // Update profile with extra fields
  const { error: profileError } = await admin
    .from('user_profiles')
    .update({
      role: role ?? 'user',
      job_title: job_title ?? null,
      is_global_admin: role === 'admin',
    })
    .eq('id', userId)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // For user role with selected modules: store as default module access (no project yet)
  // Module-per-project assignment is done from the user detail page
  // We store the intended modules in user metadata for reference
  if (role === 'user' && Array.isArray(modules) && modules.length > 0) {
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        display_name: display_name || email.split('@')[0],
        default_modules: modules,
      },
    })
  }

  return NextResponse.json({ user: authData.user })
}
