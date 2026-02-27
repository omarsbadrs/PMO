'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props { params: Promise<{ projectId: string }> }

export default function NewActivityPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    activity_id: '', name: '', wbs: '',
    planned_start: '', planned_finish: '',
    duration_days: '', status: 'not_started',
    percent_complete: '0',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('pl_activities').insert({
      project_id: projectId,
      activity_id: form.activity_id || null,
      name: form.name,
      wbs: form.wbs || null,
      planned_start: form.planned_start || null,
      planned_finish: form.planned_finish || null,
      duration_days: form.duration_days ? parseInt(form.duration_days) : null,
      status: form.status,
      percent_complete: parseFloat(form.percent_complete),
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Activity created')
    router.push(`/projects/${projectId}/planning/activities`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>New Activity</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity ID</Label>
                <Input value={form.activity_id} onChange={(e) => set('activity_id', e.target.value)} placeholder="A1000" />
              </div>
              <div className="space-y-2">
                <Label>WBS</Label>
                <Input value={form.wbs} onChange={(e) => set('wbs', e.target.value)} placeholder="1.2.3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Activity name" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Planned Start</Label>
                <Input type="date" value={form.planned_start} onChange={(e) => set('planned_start', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Planned Finish</Label>
                <Input type="date" value={form.planned_finish} onChange={(e) => set('planned_finish', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input type="number" value={form.duration_days} onChange={(e) => set('duration_days', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['not_started', 'in_progress', 'completed', 'on_hold'].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>% Complete</Label>
                <Input type="number" min="0" max="100" value={form.percent_complete} onChange={(e) => set('percent_complete', e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/planning/activities`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
