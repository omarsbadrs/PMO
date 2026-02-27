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

export default function NewIncidentPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    incident_number: '', title: '', description: '',
    severity: 'near_miss', incident_date: '', location: '',
    injured_person: '', status: 'open',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('sf_incidents').insert({
      project_id: projectId,
      incident_number: form.incident_number || null,
      title: form.title,
      description: form.description || null,
      severity: form.severity,
      incident_date: form.incident_date ? new Date(form.incident_date).toISOString() : null,
      location: form.location || null,
      injured_person: form.injured_person || null,
      status: form.status,
      reported_by: user?.id,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Incident reported')
    router.push(`/projects/${projectId}/safety/incidents`)
  }

  const severities = [
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'first_aid', label: 'First Aid' },
    { value: 'medical_treatment', label: 'Medical Treatment' },
    { value: 'lti', label: 'Lost Time Injury' },
    { value: 'fatality', label: 'Fatality' },
  ]

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Report Incident</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incident Number</Label>
                <Input value={form.incident_number} onChange={(e) => set('incident_number', e.target.value)} placeholder="INC-2024-001" />
              </div>
              <div className="space-y-2">
                <Label>Severity <span className="text-red-500">*</span></Label>
                <Select value={form.severity} onValueChange={(v) => set('severity', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {severities.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="Brief title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Detailed description of what happened" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date &amp; Time</Label>
                <Input type="datetime-local" value={form.incident_date} onChange={(e) => set('incident_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Site location" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Injured Person</Label>
                <Input value={form.injured_person} onChange={(e) => set('injured_person', e.target.value)} placeholder="Name (if applicable)" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['open', 'under_investigation', 'closed'].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Report'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/safety/incidents`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
