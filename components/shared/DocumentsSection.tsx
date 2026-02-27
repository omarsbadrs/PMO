'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Download, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Document, ModuleKey } from '@/types/app'
import { formatDate } from './DataTable'

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentsSectionProps {
  projectId: string
  moduleKey: ModuleKey
  entityType?: string
  entityId?: string
  canUpload?: boolean
  initialDocuments?: Document[]
}

export default function DocumentsSection({
  projectId, moduleKey, entityType, entityId,
  canUpload = false, initialDocuments = [],
}: DocumentsSectionProps) {
  const [docs, setDocs] = useState<Document[]>(initialDocuments)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('project_id', projectId)
    form.append('module_key', moduleKey)
    if (entityType) form.append('entity_type', entityType)
    if (entityId) form.append('entity_id', entityId)

    const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
    const json = await res.json()

    if (!res.ok) {
      toast.error(json.error ?? 'Upload failed')
    } else {
      toast.success('File uploaded successfully')
      setDocs((prev) => [json.document, ...prev])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDownload(doc: Document) {
    const res = await fetch(`/api/documents/${doc.id}/signed-url`)
    const json = await res.json()
    if (!res.ok) { toast.error('Download failed'); return }
    window.open(json.url, '_blank')
  }

  return (
    <div className="space-y-3">
      {canUpload && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Uploading…' : 'Upload File'}
          </Button>
          <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel — max 50MB</p>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No documents attached.</p>
      ) : (
        <div className="divide-y rounded-lg border bg-white overflow-hidden">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {formatBytes(doc.size_bytes)} · {formatDate(doc.uploaded_at)}
                    {doc.description && ` · ${doc.description}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
