'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Shield } from 'lucide-react'
import type { AppRole } from '@/types/app'

const MODULES = [
  { key: 'cost_control', label: 'Cost Control' },
  { key: 'planning', label: 'Planning' },
  { key: 'safety', label: 'Safety' },
  { key: 'quality', label: 'Quality' },
] as const

interface Project { id: string; name: string; code: string }
interface ModuleRoleRow { project_id: string; module_key: string }

interface Props {
  userId: string
  currentRole: AppRole
  isActive: boolean
  projects: Project[]
  moduleRoles: ModuleRoleRow[]
}

export default function UserDetailClient({ userId, currentRole, isActive, projects, moduleRoles }: Props) {
  const router = useRouter()
  const [role, setRole] = useState<AppRole>(currentRole)
  const [active, setActive] = useState(isActive)
  const [changingRole, setChangingRole] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  // Module assignments: { [projectId]: Set<moduleKey> }
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {}
    for (const r of moduleRoles) {
      if (!map[r.project_id]) map[r.project_id] = new Set()
      map[r.project_id].add(r.module_key)
    }
    return map
  })

  async function handleStatusToggle() {
    setTogglingStatus(true)
    const newActive = !active
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newActive }),
    })
    if (!res.ok) { toast.error('Failed to update status'); setTogglingStatus(false); return }
    setActive(newActive)
    toast.success(newActive ? 'User reactivated' : 'User disabled')
    setTogglingStatus(false)
    router.refresh()
  }

  async function handleRoleChange(newRole: string) {
    setChangingRole(true)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) { toast.error('Failed to update role'); setChangingRole(false); return }
    setRole(newRole as AppRole)
    toast.success('Role updated')
    setChangingRole(false)
    router.refresh()
  }

  async function handleModuleToggle(projectId: string, moduleKey: string, checked: boolean) {
    const current = new Set(assignments[projectId] ?? [])
    if (checked) current.add(moduleKey)
    else current.delete(moduleKey)

    setAssignments((prev) => ({ ...prev, [projectId]: current }))

    const res = await fetch(`/api/admin/users/${userId}/modules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, modules: Array.from(current) }),
    })
    if (!res.ok) toast.error('Failed to update module access')
  }

  const roleLabels: Record<AppRole, string> = { admin: 'Admin', manager: 'Manager', user: 'User' }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Quick Actions */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            <p className="text-xs text-gray-500">Manage user access and status</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={handleStatusToggle}
              disabled={togglingStatus}
              variant={active ? 'destructive' : 'default'}
            >
              {active ? (
                <><XCircle className="w-4 h-4 mr-2" /> Disable User</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Reactivate User</>
              )}
            </Button>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 mt-3 mb-1 font-medium">Change Role</p>
              <Select value={role} onValueChange={handleRoleChange} disabled={changingRole}>
                <SelectTrigger className="w-full">
                  <Shield className="w-3.5 h-3.5 mr-2 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Status History */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Status History</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {active ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-gray-500">Current status</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Disabled</p>
                    <p className="text-xs text-gray-500">Current status</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Role */}
        <Card className="bg-gray-50">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Current Role</p>
            <p className="text-lg font-bold text-blue-600">{roleLabels[role]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Assignments */}
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Project Assignments</CardTitle>
                <p className="text-xs text-gray-500">Select modules this user can access per project</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {role === 'admin' || role === 'manager' ? (
              <div className="text-sm text-gray-500 bg-blue-50 rounded-md p-3 border border-blue-100">
                <span className="font-medium text-blue-700">{roleLabels[role]}s</span> have access to all modules on all projects — no individual assignment needed.
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
                <p className="text-sm">No projects available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-md p-3">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {project.name}
                      <span className="text-gray-400 font-normal text-xs ml-2">({project.code})</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((mod) => {
                        const checked = assignments[project.id]?.has(mod.key) ?? false
                        return (
                          <label key={mod.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(val) => handleModuleToggle(project.id, mod.key, !!val)}
                            />
                            {mod.label}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
