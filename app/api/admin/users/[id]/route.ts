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

// PATCH /api/admin/users/[id] — update role, status, or profile fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await assertAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const admin = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (body.role !== undefined) {
    updates.role = body.role
    updates.is_global_admin = body.role === 'admin'
  }
  if (body.is_active !== undefined) updates.is_active = body.is_active
  if (body.department !== undefined) updates.department = body.department
  if (body.job_title !== undefined) updates.job_title = body.job_title
  if (body.tier !== undefined) updates.tier = body.tier
  if (body.display_name !== undefined) updates.display_name = body.display_name

  const { error } = await admin.from('user_profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync disable/enable with Supabase auth so the user cannot log in while disabled
  if (body.is_active !== undefined) {
    if (!body.is_active) {
      // Ban the user (effectively disabled — cannot log in)
      await admin.auth.admin.updateUserById(id, { ban_duration: '87600h' })
      // Sign out all active sessions immediately
      await admin.auth.admin.signOut(id, 'global')
    } else {
      // Lift the ban so the user can log in again
      await admin.auth.admin.updateUserById(id, { ban_duration: 'none' })
    }
  }

  return NextResponse.json({ success: true })
}
