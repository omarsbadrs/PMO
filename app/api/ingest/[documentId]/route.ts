import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseFile } from '@/lib/documents/parser'
import { chunkPages } from '@/lib/documents/chunker'
import { generateEmbeddings } from '@/lib/ai/embeddings'

interface Props { params: Promise<{ documentId: string }> }

export async function POST(req: NextRequest, { params }: Props) {
  // Simple shared secret to prevent unauthorized ingestion triggers
  const secret = req.headers.get('x-ingest-secret')
  if (secret !== (process.env.INGEST_SECRET ?? 'local')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId } = await params
  const admin = createAdminClient()

  // Fetch document record
  const { data: doc, error: docError } = await admin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Mark as processing
  await admin.from('documents').update({ ingestion_status: 'processing' }).eq('id', documentId)

  try {
    // Download file from storage
    const { data: fileData, error: storageError } = await admin.storage
      .from('project-files')
      .download(doc.file_path)

    if (storageError || !fileData) throw new Error(storageError?.message ?? 'Failed to download file')

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Parse file into pages
    const pages = await parseFile(buffer, doc.mime_type, doc.file_name)

    // Chunk the pages
    const chunks = chunkPages(pages)

    if (chunks.length === 0) {
      await admin.from('documents').update({ ingestion_status: 'done' }).eq('id', documentId)
      return NextResponse.json({ message: 'No text extracted', chunks: 0 })
    }

    // Generate embeddings
    const texts = chunks.map((c) => c.text)
    const embeddings = await generateEmbeddings(texts)

    // Delete old chunks if re-ingesting
    await admin.from('document_chunks').delete().eq('document_id', documentId)

    // Insert new chunks with embeddings
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content_text: chunk.text,
      metadata_json: chunk.metadata,
      embedding: JSON.stringify(embeddings[i]),
    }))

    const { error: insertError } = await admin.from('document_chunks').insert(chunkRows)
    if (insertError) throw new Error(insertError.message)

    // Mark as done
    await admin.from('documents').update({ ingestion_status: 'done' }).eq('id', documentId)

    return NextResponse.json({ message: 'Ingestion complete', chunks: chunks.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await admin.from('documents').update({ ingestion_status: 'failed' }).eq('id', documentId)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
