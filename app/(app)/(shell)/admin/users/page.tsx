import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, ChevronRight } from 'lucide-react'
import type { UserProfile } from '@/types/app'

const roleBadge: Record<string, { label: string; className: string }> = {
  admin:   { label: 'Admin',   className: 'bg-purple-100 text-purple-800' },
  manager: { label: 'Manager', className: 'bg-blue-100 text-blue-800' },
  user:    { label: 'User',    className: 'bg-gray-100 text-gray-700' },
}

export default async function AdminUsersPage() {
  await requireGlobalAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const users = (data ?? []) as UserProfile[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users in the system</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="w-4 h-4 mr-2" /> Add User
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users yet.</td></tr>
            )}
            {users.map((u) => {
              const rb = roleBadge[u.role ?? 'user'] ?? roleBadge.user
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(u.display_name || u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.department ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rb.className}`}>
                      {rb.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active !== false ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Disabled</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-gray-400 hover:text-gray-600">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
