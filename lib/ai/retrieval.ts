// SERVER-SIDE ONLY
import { createAdminClient } from '@/lib/supabase/admin'

export interface RetrievedChunk {
  id: string
  document_id: string
  chunk_index: number
  content_text: string
  metadata_json: Record<string, unknown>
  file_name: string
  module_key: string
  entity_type: string | null
  similarity: number
}

export async function retrieveChunks(
  queryEmbedding: number[],
  projectId: string | string[],
  moduleKey?: string,
  limit = 8,
  threshold = 0.70
): Promise<RetrievedChunk[]> {
  const admin = createAdminClient()
  const ids = Array.isArray(projectId) ? projectId : [projectId]

  if (ids.length === 1) {
    // Single project — use RPC directly
    const { data, error } = await admin.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      p_project_id: ids[0],
      p_module_key: moduleKey ?? null,
      match_threshold: threshold,
      match_count: limit,
    })
    if (error) { console.error('RAG retrieval error:', error); return [] }
    return data ?? []
  }

  // Multiple projects — run RPC per project in parallel, merge by similarity
  const perProject = Math.ceil(limit / ids.length) + 2   // slight overselect, trim after
  const results = await Promise.all(
    ids.map(async (pid) => {
      const { data, error } = await admin.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        p_project_id: pid,
        p_module_key: moduleKey ?? null,
        match_threshold: threshold,
        match_count: perProject,
      })
      if (error) { console.error(`RAG retrieval error for ${pid}:`, error); return [] }
      return (data ?? []) as RetrievedChunk[]
    })
  )

  // Merge, sort by similarity desc, take top `limit`
  return results
    .flat()
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
