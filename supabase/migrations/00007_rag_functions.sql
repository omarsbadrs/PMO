-- ============================================================
-- 00007_rag_functions.sql
-- pgvector similarity search function for RAG
-- ============================================================

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  p_project_id UUID,
  p_module_key module_key_enum DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.70,
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_index INTEGER,
  content_text TEXT,
  metadata_json JSONB,
  file_name TEXT,
  module_key module_key_enum,
  entity_type TEXT,
  similarity FLOAT
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content_text,
    dc.metadata_json,
    d.file_name,
    d.module_key,
    d.entity_type,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.project_id = p_project_id
    AND (p_module_key IS NULL OR d.module_key = p_module_key)
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
