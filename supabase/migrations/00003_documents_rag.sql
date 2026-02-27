-- ============================================================
-- 00003_documents_rag.sql
-- Document registry + RAG chunks/embeddings
-- Requires pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
-- ============================================================

-- Document registry
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  module_key module_key_enum,
  entity_type TEXT,
  entity_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revision TEXT,
  tags TEXT[],
  description TEXT,
  ingestion_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ingestion_status IN ('pending', 'processing', 'done', 'failed'))
);

-- RAG: text chunks + embeddings in one table
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content_text TEXT NOT NULL,
  metadata_json JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
