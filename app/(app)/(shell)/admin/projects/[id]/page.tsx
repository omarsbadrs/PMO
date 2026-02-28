'use client'

import { useState, useEffect, use } from 'react'
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

interface Props { params: Promise<{ id: string }> }

export default function EditProjectPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', code: '', description: '', status: 'active',
    start_date: '', end_date: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? '',
          code: data.code ?? '',
          description: data.description ?? '',
          status: data.status ?? 'active',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
      }
      setLoading(false)
    })
  }, [id])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('projects').update({
      name: form.name,
      code: form.code.toUpperCase(),
      description: form.description || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }).eq('id', id)

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Project updated')
    router.push('/admin/projects')
  }

  if (loading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Edit Project</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Code <span className="text-red-500">*</span></Label>
                <Input value={form.code} onChange={(e) => set('code', e.target.value)} required className="font-mono" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/projects">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
