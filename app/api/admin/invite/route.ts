import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify global admin
  const { data: profile } = await supabase
    .from('user_profiles').select('is_global_admin').eq('id', user.id).single()
  if (!profile?.is_global_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, display_name } = await req.json()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: display_name || email.split('@')[0] },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data.user })
}
