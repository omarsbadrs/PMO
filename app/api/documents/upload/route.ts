import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null
  const moduleKey = formData.get('module_key') as string | null
  const entityType = formData.get('entity_type') as string | null
  const entityId = formData.get('entity_id') as string | null
  const description = formData.get('description') as string | null
  const revision = formData.get('revision') as string | null

  if (!file || !projectId || !moduleKey) {
    return NextResponse.json({ error: 'file, project_id, and module_key are required' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF, Word, and Excel files are allowed' }, { status: 400 })
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File must be under 50MB' }, { status: 400 })
  }

  // Check write permission via RLS
  const { data: canWrite } = await supabase.rpc('can_write_module', {
    p_project_id: projectId,
    p_module: moduleKey,
  })
  if (!canWrite) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const admin = createAdminClient()
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `project/${projectId}/${moduleKey}/${entityType ?? 'general'}/${entityId ?? 'general'}/${Date.now()}_${safeFileName}`

  // Upload to storage
  const bytes = await file.arrayBuffer()
  const { error: storageError } = await admin.storage
    .from('project-files')
    .upload(filePath, bytes, { contentType: file.type, upsert: false })

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  // Register in documents table
  const { data: doc, error: dbError } = await admin
    .from('documents')
    .insert({
      project_id: projectId,
      module_key: moduleKey,
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
      description,
      revision,
      ingestion_status: 'pending',
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup storage on DB failure
    await admin.storage.from('project-files').remove([filePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Trigger async ingestion (fire-and-forget)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/ingest/${doc.id}`, {
    method: 'POST',
    headers: { 'x-ingest-secret': process.env.INGEST_SECRET ?? 'local' },
  }).catch(() => {/* Ingestion is best-effort */})

  return NextResponse.json({ document: doc }, { status: 201 })
}
