'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  body: string
  created_at: string
  author_user_id: string | null
  user_profiles: { display_name: string } | null
}

interface Props {
  projectId: string
  moduleKey: string
  entityType: string
  entityId: string
}

export default function CommentsSection({ projectId, moduleKey, entityType, entityId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, user_profiles(display_name)')
      .eq('project_id', projectId)
      .eq('module_key', moduleKey)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
  }, [projectId, moduleKey, entityType, entityId])

  useEffect(() => {
    load()
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [load])

  async function submit() {
    if (!body.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('comments').insert({
      project_id: projectId,
      module_key: moduleKey,
      entity_type: entityType,
      entity_id: entityId,
      author_user_id: user?.id,
      body: body.trim(),
    })
    if (error) { toast.error(error.message); setSubmitting(false); return }
    setBody('')
    await load()
    setSubmitting(false)
  }

  async function remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-xs text-gray-600">
                {c.user_profiles?.display_name ?? 'Unknown'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
                {c.author_user_id === currentUserId && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
          }}
        />
        <Button onClick={submit} disabled={submitting || !body.trim()} className="self-end">
          {submitting ? '…' : 'Post'}
        </Button>
      </div>
      <p className="text-xs text-gray-400">Ctrl+Enter to post</p>
    </div>
  )
}
