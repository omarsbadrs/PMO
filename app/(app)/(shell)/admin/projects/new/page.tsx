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

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
  { value: 'SAR', label: 'SAR — Saudi Riyal (﷼)' },
  { value: 'EGP', label: 'EGP — Egyptian Pound (E£)' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', description: '', status: 'active',
    currency: 'USD', usd_rate: '1', start_date: '', end_date: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('projects').insert({
      name: form.name,
      code: form.code.toUpperCase(),
      description: form.description || null,
      status: form.status,
      currency: form.currency,
      usd_rate: parseFloat(form.usd_rate) || 1,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      created_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Project created')
    router.push('/admin/projects')
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>New Project</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Row 1: Name + Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                  placeholder="Offshore Platform Alpha"
                />
              </div>
              <div className="space-y-2">
                <Label>Code <span className="text-red-500">*</span></Label>
                <Input
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  required
                  placeholder="OPA-2024"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Brief project summary…"
              />
            </div>

            {/* Row 3: Status + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['active', 'on_hold', 'completed', 'archived'].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency <span className="text-red-500">*</span></Label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3b: USD Exchange Rate */}
            <div className="space-y-2">
              <Label>USD Exchange Rate <span className="text-gray-400 font-normal text-xs">(1 USD = X {form.currency})</span></Label>
              <Input
                type="number"
                step="0.000001"
                min="0.000001"
                value={form.usd_rate}
                onChange={(e) => set('usd_rate', e.target.value)}
                placeholder="1.000000"
                className="max-w-xs"
              />
              <p className="text-xs text-gray-400">Used to convert KPIs to USD in the portfolio view. Leave as 1 for USD projects.</p>
            </div>

            {/* Row 4: Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</Button>
            <Button type="button" variant="outline" asChild><Link href="/admin/projects">Cancel</Link></Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
