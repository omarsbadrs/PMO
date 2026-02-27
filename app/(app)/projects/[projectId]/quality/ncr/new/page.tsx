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

export default function NewNcrPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    ncr_number: '', title: '', description: '',
    severity: 'minor', area: '', raised_date: '', due_date: '', status: 'open',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('ql_ncr').insert({
      project_id: projectId,
      ncr_number: form.ncr_number || null,
      title: form.title,
      description: form.description || null,
      severity: form.severity,
      area: form.area || null,
      raised_date: form.raised_date || null,
      raised_by: user?.id,
      due_date: form.due_date || null,
      status: form.status,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('NCR raised')
    router.push(`/projects/${projectId}/quality/ncr`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Raise Non-Conformance Report</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NCR Number</Label>
                <Input value={form.ncr_number} onChange={(e) => set('ncr_number', e.target.value)} placeholder="NCR-2024-001" />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => set('severity', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['minor', 'major', 'critical'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="NCR title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Non-conformance description" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="Structural, MEP…" />
              </div>
              <div className="space-y-2">
                <Label>Raised Date</Label>
                <Input type="date" value={form.raised_date} onChange={(e) => set('raised_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['open', 'under_review', 'corrective_action', 'closed', 'voided'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Raise NCR'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/quality/ncr`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
