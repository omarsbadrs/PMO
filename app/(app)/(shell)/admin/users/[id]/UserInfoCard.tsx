'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { AppRole } from '@/types/app'

const DEPARTMENTS = [
  'Cost Control',
  'Planning',
  'Safety',
  'Quality',
]

const JOB_TITLES = [
  'Junior Engineer',
  'Senior Engineer',
  'Team Lead',
  'Section Head',
  'Manager',
  'Senior Manager',
  'Director',
]

const roleBadgeClass: Record<AppRole, string> = {
  admin:   'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  user:    'bg-gray-100 text-gray-700',
}
const roleLabel: Record<AppRole, string> = {
  admin: 'Admin', manager: 'Manager', user: 'User',
}

interface Props {
  userId: string
  display_name: string
  email: string
  department: string | null
  job_title: string | null
  tier: string | null
  role: AppRole
}

export default function UserInfoCard({ userId, display_name, email, department, job_title, tier, role }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    display_name,
    department: department ?? '',
    job_title: job_title ?? '',
    tier: tier ?? '',
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function cancel() {
    setForm({
      display_name,
      department: department ?? '',
      job_title: job_title ?? '',
      tier: tier ?? '',
    })
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: form.display_name || undefined,
        department: form.department || null,
        job_title: form.job_title || null,
        tier: form.tier || null,
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'Failed to save')
      setSaving(false)
      return
    }
    toast.success('Profile updated')
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">User Information</CardTitle>
              <p className="text-xs text-gray-500">Personal and contact details</p>
            </div>
          </div>

          {/* Edit / Save / Cancel buttons */}
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 h-8">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5 h-8">
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={cancel} disabled={saving} className="gap-1.5 h-8">
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!editing ? (
          /* ── View mode ── */
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
              <p className="text-sm font-semibold text-gray-900">{form.display_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </p>
              <p className="text-sm font-semibold text-gray-900">{email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Department</p>
              <p className="text-sm font-semibold text-gray-900">{form.department || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Job Title</p>
              <p className="text-sm font-semibold text-gray-900">{form.job_title || 'Not specified'}</p>
            </div>
            <div className="pt-2 border-t col-span-2 grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass[role]}`}>
                  {roleLabel[role]}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tier</p>
                <p className="text-sm font-semibold text-gray-900">{form.tier || 'Not specified'}</p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </Label>
              <Input value={email} disabled className="bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={form.department} onValueChange={(v) => set('department', v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select department…" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Job Title</Label>
              <Select value={form.job_title} onValueChange={(v) => set('job_title', v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select job title…" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 border-t col-span-2 grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <div className={`inline-flex items-center px-2 py-1.5 rounded text-xs font-medium ${roleBadgeClass[role]}`}>
                  {roleLabel[role]} <span className="ml-1 text-gray-400 font-normal">(change in Quick Actions)</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tier</Label>
                <Input
                  value={form.tier}
                  onChange={(e) => set('tier', e.target.value)}
                  placeholder="e.g. Senior"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
