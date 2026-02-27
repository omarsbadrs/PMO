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

export default function NewCommitmentPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    po_number: '', vendor: '', description: '',
    amount: '', currency: 'USD', status: 'pending',
    issue_date: '', expiry_date: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('cc_commitments').insert({
      project_id: projectId,
      po_number: form.po_number || null,
      vendor: form.vendor,
      description: form.description,
      amount: form.amount ? parseFloat(form.amount) : null,
      currency: form.currency,
      status: form.status,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Commitment created')
    router.push(`/projects/${projectId}/cost-control/commitments`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>New Commitment</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={form.po_number} onChange={(e) => set('po_number', e.target.value)} placeholder="PO-2024-001" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'AED', 'SAR'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vendor <span className="text-red-500">*</span></Label>
              <Input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} required placeholder="Vendor name" />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={2} placeholder="Scope of commitment" />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={form.issue_date} onChange={(e) => set('issue_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'active', 'closed', 'cancelled'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/cost-control/commitments`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
