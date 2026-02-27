'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDate } from '@/components/shared/DataTable'
import { Plus, X } from 'lucide-react'

interface Action {
  id: string
  title: string
  due_date: string | null
  status: string
  priority: string
  owner_user_id: string | null
  user_profiles: { display_name: string } | null
}

interface Props {
  projectId: string
  moduleKey: string
  entityType: string
  entityId: string
}

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function ActionsSection({ projectId, moduleKey, entityType, entityId }: Props) {
  const [actions, setActions] = useState<Action[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', due_date: '', priority: 'medium', status: 'open',
  })

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('actions')
      .select('*, user_profiles(display_name)')
      .eq('project_id', projectId)
      .eq('module_key', moduleKey)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    setActions((data as Action[]) ?? [])
  }, [projectId, moduleKey, entityType, entityId])

  useEffect(() => { load() }, [load])

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit() {
    if (!form.title.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('actions').insert({
      project_id: projectId,
      module_key: moduleKey,
      entity_type: entityType,
      entity_id: entityId,
      title: form.title.trim(),
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
      created_by: user?.id,
    })
    if (error) { toast.error(error.message); setSubmitting(false); return }
    setForm({ title: '', due_date: '', priority: 'medium', status: 'open' })
    setShowForm(false)
    await load()
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    const { error } = await supabase.from('actions').update({ status }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4 mr-1" />New Action
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Action Item</span>
            <button onClick={() => setShowForm(false)}><X className="size-4" /></button>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Action title" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setField('due_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setField('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['low', 'medium', 'high', 'critical'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['open', 'in_progress', 'closed', 'cancelled'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" onClick={submit} disabled={submitting || !form.title.trim()}>
            {submitting ? 'Saving…' : 'Create'}
          </Button>
        </div>
      )}

      {actions.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">No actions yet.</p>
      )}

      <div className="space-y-2">
        {actions.map((a) => (
          <div key={a.id} className="border rounded-lg p-3 text-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{a.title}</p>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <Badge className={`text-xs ${priorityColor[a.priority]}`}>{a.priority}</Badge>
                {a.due_date && (
                  <span className="text-xs text-gray-400">Due {formatDate(a.due_date)}</span>
                )}
              </div>
            </div>
            <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
              <SelectTrigger className={`w-32 text-xs h-7 ${statusColor[a.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['open', 'in_progress', 'closed', 'cancelled'].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
