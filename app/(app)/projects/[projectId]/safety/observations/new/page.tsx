'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props { params: Promise<{ projectId: string }> }

export default function NewObservationPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    observation_number: '', type: 'unsafe_condition', description: '',
    location: '', observed_date: '', status: 'open', corrective_action: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('sf_observations').insert({
      project_id: projectId,
      observation_number: form.observation_number || null,
      type: form.type,
      description: form.description,
      location: form.location || null,
      observed_date: form.observed_date || null,
      observed_by: user?.id,
      status: form.status,
      corrective_action: form.corrective_action || null,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Observation recorded')
    router.push(`/projects/${projectId}/safety/observations`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Record Safety Observation</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Observation Number</Label>
                <Input value={form.observation_number} onChange={(e) => set('observation_number', e.target.value)} placeholder="OBS-001" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['unsafe_condition', 'unsafe_act', 'positive', 'near_miss'].map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={3} placeholder="Describe what was observed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Site location" />
              </div>
              <div className="space-y-2">
                <Label>Observed Date</Label>
                <Input type="date" value={form.observed_date} onChange={(e) => set('observed_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Corrective Action</Label>
              <Textarea value={form.corrective_action} onChange={(e) => set('corrective_action', e.target.value)} rows={2} placeholder="Corrective action taken or required" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['open', 'in_progress', 'closed'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/safety/observations`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
