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

export default function NewBudgetPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discipline: '',
    baseline_amount: '', approved_amount: '',
    status: 'draft', notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('cc_budget').insert({
      project_id: projectId,
      code: form.code || null,
      description: form.description,
      discipline: form.discipline || null,
      baseline_amount: form.baseline_amount ? parseFloat(form.baseline_amount) : null,
      approved_amount: form.approved_amount ? parseFloat(form.approved_amount) : null,
      status: form.status,
      notes: form.notes || null,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }
    toast.success('Budget item created')
    router.push(`/projects/${projectId}/cost-control/budget`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Budget Item</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="CC-001" />
              </div>
              <div className="space-y-2">
                <Label>Discipline</Label>
                <Input value={form.discipline} onChange={(e) => set('discipline', e.target.value)} placeholder="Civil, Mechanical…" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Input value={form.description} onChange={(e) => set('description', e.target.value)} required placeholder="Budget item description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baseline Amount</Label>
                <Input type="number" value={form.baseline_amount} onChange={(e) => set('baseline_amount', e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Approved Amount</Label>
                <Input type="number" value={form.approved_amount} onChange={(e) => set('approved_amount', e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['draft', 'pending', 'approved'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/cost-control/budget`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
