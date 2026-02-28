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

// PUT /api/admin/users/[id]/modules
// Body: { projectId: string, modules: string[] }  — full replace for that project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await assertAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { projectId, modules } = await req.json() as { projectId: string; modules: string[] }
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  const admin = createAdminClient()

  // Delete existing roles for this user+project
  await admin.from('module_roles').delete().eq('user_id', id).eq('project_id', projectId)

  // Insert new ones (always VIEWER for regular users)
  if (modules.length > 0) {
    const rows = modules.map((module_key) => ({
      user_id: id,
      project_id: projectId,
      module_key,
      role: 'VIEWER',
    }))
    const { error } = await admin.from('module_roles').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Ensure a project_memberships row exists so the project is visible to the user
    await admin.from('project_memberships').upsert(
      { user_id: id, project_id: projectId, is_active: true },
      { onConflict: 'user_id,project_id' }
    )
  } else {
    // No modules left — remove project membership so the project is hidden
    await admin.from('project_memberships')
      .delete()
      .eq('user_id', id)
      .eq('project_id', projectId)
  }

  return NextResponse.json({ success: true })
}
