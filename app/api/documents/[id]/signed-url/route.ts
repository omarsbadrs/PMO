import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch document (RLS enforces access)
  const { data: doc, error } = await supabase
    .from('documents')
    .select('file_path, file_name, module_key, project_id')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
  }

  // Generate signed URL (60 minutes)
  const admin = createAdminClient()
  const { data: urlData, error: urlError } = await admin.storage
    .from('project-files')
    .createSignedUrl(doc.file_path, 3600, { download: doc.file_name })

  if (urlError || !urlData) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  return NextResponse.json({ url: urlData.signedUrl })
}
