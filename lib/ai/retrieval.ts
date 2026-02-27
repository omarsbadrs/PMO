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
  projectId: string,
  moduleKey?: string,
  limit = 8,
  threshold = 0.70
): Promise<RetrievedChunk[]> {
  const admin = createAdminClient()

  // Use pgvector cosine similarity via RPC function
  const { data, error } = await admin.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    p_project_id: projectId,
    p_module_key: moduleKey ?? null,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('RAG retrieval error:', error)
    return []
  }

  return data ?? []
}
