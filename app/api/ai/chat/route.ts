import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { retrieveChunks } from '@/lib/ai/retrieval'
import { getStructuredContext } from '@/lib/ai/db-query'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, projectId, moduleKey } = await req.json()

  if (!message) return new Response('message is required', { status: 400 })

  const admin = createAdminClient()

  // ── Resolve project scope ─────────────────────────────────────────
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin, role')
    .eq('id', user.id)
    .single()

  const isElevated = profile?.is_global_admin || profile?.role === 'admin' || profile?.role === 'manager'

  let resolvedIds: string[]
  let scopeName: string

  if (!projectId || projectId === 'all') {
    // "All Projects" mode — resolve to all accessible project IDs
    if (isElevated) {
      const { data: allProjects } = await admin.from('projects').select('id').eq('status', 'active')
      resolvedIds = (allProjects ?? []).map((p) => p.id)
      scopeName = 'all active projects'
    } else {
      const [{ data: memberships }, { data: moduleRoles }] = await Promise.all([
        admin.from('project_memberships').select('project_id').eq('user_id', user.id).eq('is_active', true),
        admin.from('module_roles').select('project_id').eq('user_id', user.id),
      ])
      resolvedIds = [...new Set([
        ...(memberships ?? []).map((m) => m.project_id),
        ...(moduleRoles ?? []).map((r) => r.project_id),
      ])]
      scopeName = 'all your accessible projects'
    }

    if (resolvedIds.length === 0) {
      return new Response('No accessible projects found', { status: 403 })
    }
  } else {
    // Single project mode — verify access
    if (!isElevated) {
      const [{ data: membership }, { data: moduleRole }] = await Promise.all([
        supabase.from('project_memberships').select('id').eq('user_id', user.id).eq('project_id', projectId).eq('is_active', true).maybeSingle(),
        supabase.from('module_roles').select('id').eq('user_id', user.id).eq('project_id', projectId).limit(1).maybeSingle(),
      ])
      if (!membership && !moduleRole) {
        return new Response('Access denied to this project', { status: 403 })
      }
    }

    const { data: project } = await admin.from('projects').select('id, name').eq('id', projectId).single()
    resolvedIds = [projectId]
    scopeName = project?.name ?? projectId
  }

  // ── Retrieve context (document chunks + structured DB data) ───────
  const [queryEmbedding, dbContext] = await Promise.all([
    generateEmbedding(message),
    getStructuredContext(message, resolvedIds, moduleKey),
  ])
  const chunks = await retrieveChunks(queryEmbedding, resolvedIds, moduleKey)

  const documentContext = chunks.length > 0
    ? chunks.map((c) => {
        const page = c.metadata_json?.pageNumber ?? c.chunk_index + 1
        return `[doc: ${c.file_name}, p.${page}]\n${c.content_text}`
      }).join('\n\n---\n\n')
    : ''

  const moduleLabel = moduleKey
    ? `Module scope: ${moduleKey.replace(/_/g, ' ')} only.`
    : 'Module scope: all modules (Cost Control, Planning, Safety, Quality).'

  const isMulti = resolvedIds.length > 1
  const hasContext = documentContext || dbContext

  const systemPrompt = `You are a PMO assistant for ${isMulti ? scopeName : `project "${scopeName}"`}.
${moduleLabel}
${isMulti
  ? 'Data is provided from multiple projects. Each record is labelled [ProjectName] so you can distinguish between them. When answering, clearly state which project each piece of data belongs to.'
  : 'IMPORTANT: Only answer using data from this specific project. Do not reference or infer data from any other project.'}

${dbContext ? `DATABASE RECORDS:\n${dbContext}\n\n` : ''}${documentContext ? `DOCUMENT CONTEXT:\n${documentContext}\n\n` : ''}${!hasContext ? 'No relevant data or documents found for this query.\n\n' : ''}Instructions:
- Answer ONLY based on the DATABASE RECORDS and DOCUMENT CONTEXT provided above.
- Cite database sources as: [data: table name], document sources as: [doc: filename, p.PAGE]
- If the module scope is set to a specific module, only discuss data from that module.
- If no context was provided, clearly state that no data was found and suggest the user add data or upload documents.
- Be concise and professional.
- Format currency and dates clearly.`

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Chunks-Used': String(chunks.length),
    },
  })
}
