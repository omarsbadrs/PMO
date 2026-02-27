'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props { params: Promise<{ projectId: string }> }

export default function NewForecastPage({ params }: Props) {
  const { projectId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    period: '', eac: '', etc: '', notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('cc_forecasts').insert({
      project_id: projectId,
      period: form.period,
      eac: form.eac ? parseFloat(form.eac) : null,
      etc: form.etc ? parseFloat(form.etc) : null,
      notes: form.notes || null,
      created_by: user?.id,
      updated_by: user?.id,
    })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Forecast recorded')
    router.push(`/projects/${projectId}/cost-control/forecasts`)
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader><CardTitle>New Forecast</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Period <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.period} onChange={(e) => set('period', e.target.value)} required />
              <p className="text-xs text-gray-400">Use the first day of the reporting period (e.g. 2024-12-01)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>EAC (Estimate at Completion)</Label>
                <Input type="number" value={form.eac} onChange={(e) => set('eac', e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>ETC (Estimate to Complete)</Label>
                <Input type="number" value={form.etc} onChange={(e) => set('etc', e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record'}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${projectId}/cost-control/forecasts`}>Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
