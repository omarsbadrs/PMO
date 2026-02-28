'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

const MODULES = [
  { key: 'cost_control', label: 'Cost Control' },
  { key: 'planning', label: 'Planning' },
  { key: 'safety', label: 'Safety' },
  { key: 'quality', label: 'Quality' },
] as const

const ROLES = ['VIEWER', 'INPUT', 'MODULE_ADMIN'] as const

interface Project { id: string; name: string; code: string }
interface ModuleRole { id: string; project_id: string; module_key: string; role: string }

interface Props {
  userId: string
  projects: Project[]
  existingRoles: ModuleRole[]
}

export default function RolesManager({ userId, projects, existingRoles }: Props) {
  const [roles, setRoles] = useState<ModuleRole[]>(existingRoles)
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedRole, setSelectedRole] = useState('VIEWER')
  const [saving, setSaving] = useState(false)

  async function addRole() {
    if (!selectedProject || !selectedModule) {
      toast.error('Select a project and module')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('module_roles')
      .upsert({
        user_id: userId,
        project_id: selectedProject,
        module_key: selectedModule,
        role: selectedRole,
      }, { onConflict: 'user_id,project_id,module_key' })
      .select()
      .single()

    if (error) { toast.error(error.message); setSaving(false); return }
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.project_id === selectedProject && r.module_key === selectedModule)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = data
        return next
      }
      return [...prev, data]
    })
    toast.success('Role saved')
    setSaving(false)
  }

  async function removeRole(roleId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('module_roles').delete().eq('id', roleId)
    if (error) { toast.error(error.message); return }
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
    toast.success('Role removed')
  }

  const grouped = projects.map((p) => ({
    project: p,
    roles: roles.filter((r) => r.project_id === p.id),
  })).filter((g) => g.roles.length > 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add Role</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addRole} disabled={saving || !selectedProject || !selectedModule}>
            {saving ? 'Saving…' : 'Add / Update Role'}
          </Button>
        </CardContent>
      </Card>

      {grouped.length === 0 ? (
        <p className="text-sm text-gray-500">No roles assigned yet.</p>
      ) : (
        grouped.map(({ project, roles: pRoles }) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {project.name} <span className="text-gray-400 font-normal">({project.code})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pRoles.map((r) => {
                  const mod = MODULES.find((m) => m.key === r.module_key)
                  return (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-sm">{mod?.label ?? r.module_key}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{r.role}</Badge>
                        <button
                          onClick={() => removeRole(r.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove role"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
