'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const MODULES = [
  { key: 'cost_control', label: 'Cost Control' },
  { key: 'planning',     label: 'Planning' },
  { key: 'safety',       label: 'Safety' },
  { key: 'quality',      label: 'Quality' },
] as const

const ALL_MODULE_KEYS = MODULES.map((m) => m.key)

const JOB_TITLES = [
  'Junior Engineer',
  'Senior Engineer',
  'Team Lead',
  'Section Head',
  'Manager',
  'Senior Manager',
  'Director',
]

export default function NewUserPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    email: '',
    password: '',
    role: 'user',
    job_title: '',
  })
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  // When role changes, lock modules for admin/manager
  useEffect(() => {
    if (form.role === 'admin' || form.role === 'manager') {
      setSelectedModules([...ALL_MODULE_KEYS])
    } else {
      setSelectedModules([])
    }
  }, [form.role])

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isLocked = form.role === 'admin' || form.role === 'manager'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Email and password are required'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (form.role === 'user' && selectedModules.length === 0) {
      toast.error('Select at least one module for User role')
      return
    }

    setSaving(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, modules: selectedModules }),
    })

    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to create user'); setSaving(false); return }

    toast.success('User created successfully')
    router.push('/admin/users')
    router.refresh()
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Add New User</h1>
          <p className="text-sm text-gray-500">Create a user account with direct access</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Account Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="Ahmed Ibrahim"
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                placeholder="ahmed@company.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>Password <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => set('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — full access + admin panel</SelectItem>
                  <SelectItem value="manager">Manager — full data access, no admin panel</SelectItem>
                  <SelectItem value="user">User — view-only on assigned modules</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modules — inline checkboxes */}
            <div className="space-y-1.5">
              <Label>
                Modules
                {isLocked && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    ({form.role === 'admin' ? 'Admin' : 'Manager'} has access to all)
                  </span>
                )}
              </Label>
              <div className="border rounded-md p-3 space-y-2">
                {MODULES.map((mod) => {
                  const checked = selectedModules.includes(mod.key)
                  return (
                    <div key={mod.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`mod-${mod.key}`}
                        checked={checked}
                        disabled={isLocked}
                        onCheckedChange={(val) => {
                          if (!isLocked) {
                            setSelectedModules((prev) =>
                              val ? [...prev, mod.key] : prev.filter((k) => k !== mod.key)
                            )
                          }
                        }}
                      />
                      <label
                        htmlFor={`mod-${mod.key}`}
                        className={`text-sm ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}
                      >
                        {mod.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Job Title dropdown */}
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Select value={form.job_title} onValueChange={(v) => set('job_title', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job title…" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create User'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
