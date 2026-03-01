'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'EGP']

interface Props {
  projectId: string
  defaultCurrency: string
}

export default function NewActualForm({ projectId, defaultCurrency }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    invoice_number: '', vendor: '', description: '',
    amount: '', document_currency: defaultCurrency, fx_rate: '1',
    cost_date: '', status: 'pending',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('cc_actuals').insert({
      project_id: projectId,
      invoice_number: form.invoice_number || null,
      vendor: form.vendor || null,
      description: form.description,
      amount: parseFloat(form.amount),
      document_currency: form.document_currency,
      fx_rate: parseFloat(form.fx_rate) || 1,
      cost_date: form.cost_date || null,
      status: form.status,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Actual cost recorded')
    router.push(`/projects/${projectId}/cost-control/actuals`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Record Actual Cost</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input value={form.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} placeholder="INV-001" />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} placeholder="Vendor name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={2} placeholder="Description of cost" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Doc Amount <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Doc Currency</Label>
                <Select value={form.document_currency} onValueChange={(v) => set('document_currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>FX Rate <span className="text-gray-400 text-xs font-normal">(→ {defaultCurrency})</span></Label>
                <Input type="number" step="0.000001" min="0.000001" value={form.fx_rate} onChange={(e) => set('fx_rate', e.target.value)} placeholder="1.000000" />
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
              Project amount = {form.amount || '0'} {form.document_currency} × {form.fx_rate || '1'} = {((parseFloat(form.amount) || 0) * (parseFloat(form.fx_rate) || 1)).toFixed(2)} {defaultCurrency}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Date</Label>
                <Input type="date" value={form.cost_date} onChange={(e) => set('cost_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'approved', 'rejected'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/cost-control/actuals`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
