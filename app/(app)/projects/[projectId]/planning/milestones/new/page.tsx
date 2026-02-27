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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props { params: Promise<{ projectId: string }> }

export default function NewMilestonePage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '',
    planned_date: '', status: 'pending',
    is_key_milestone: false,
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('pl_milestones').insert({
      project_id: projectId,
      name: form.name,
      description: form.description || null,
      planned_date: form.planned_date || null,
      status: form.status,
      is_key_milestone: form.is_key_milestone,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Milestone created')
    router.push(`/projects/${projectId}/planning/milestones`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>New Milestone</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Milestone name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Planned Date</Label>
                <Input type="date" value={form.planned_date} onChange={(e) => set('planned_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'at_risk', 'achieved', 'missed'].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="key-milestone"
                checked={form.is_key_milestone}
                onCheckedChange={(v) => set('is_key_milestone', !!v)}
              />
              <Label htmlFor="key-milestone">Key Milestone</Label>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/planning/milestones`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
