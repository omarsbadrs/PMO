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

  if (!message || !projectId) {
    return new Response('message and projectId are required', { status: 400 })
  }

  // Verify user has access to this project
  const { data: membership } = await supabase
    .from('project_memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .single()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (!membership && !profile?.is_global_admin) {
    return new Response('Access denied to this project', { status: 403 })
  }

  // Fetch project name
  const admin = createAdminClient()
  const { data: project } = await admin.from('projects').select('name').eq('id', projectId).single()

  // Retrieve document chunks and structured DB data in parallel
  const [queryEmbedding, dbContext] = await Promise.all([
    generateEmbedding(message),
    getStructuredContext(message, projectId, moduleKey),
  ])
  const chunks = await retrieveChunks(queryEmbedding, projectId, moduleKey)

  const documentContext = chunks.length > 0
    ? chunks.map((c) => {
        const page = c.metadata_json?.pageNumber ?? c.chunk_index + 1
        return `[doc: ${c.file_name}, p.${page}]\n${c.content_text}`
      }).join('\n\n---\n\n')
    : ''

  const hasContext = documentContext || dbContext
  const systemPrompt = `You are a PMO assistant for project "${project?.name ?? projectId}".
${moduleKey ? `Current module scope: ${moduleKey.replace(/_/g, ' ')}.` : ''}

${dbContext ? `DATABASE RECORDS:\n${dbContext}\n\n` : ''}${documentContext ? `DOCUMENT CONTEXT:\n${documentContext}\n\n` : ''}${!hasContext ? 'No relevant data or documents found for this query.\n\n' : ''}Instructions:
- Answer based on the DATABASE RECORDS and DOCUMENT CONTEXT provided above.
- Cite database sources as: [data: table name], document sources as: [doc: filename, p.PAGE]
- If no context was provided, clearly state that no data was found and suggest the user add data or upload documents.
- Be concise and professional.
- Format currency and dates clearly.`

  // Stream response from Claude
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
