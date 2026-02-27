import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import DataTable, { Column } from '@/components/shared/DataTable'
import type { UserProfile } from '@/types/app'

const columns: Column<UserProfile>[] = [
  { key: 'display_name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'is_global_admin', header: 'Role', type: 'boolean_admin', className: 'w-32' },
  { key: 'created_at', header: 'Joined', type: 'date', className: 'w-32' },
]

export default async function AdminUsersPage() {
  await requireGlobalAdmin()
  const admin = createAdminClient()
  const { data } = await admin.from('user_profiles').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Users</h1><p className="text-sm text-gray-500">{data?.length ?? 0} users in the system</p></div>
        <Button asChild><Link href="/admin/users/invite"><UserPlus className="w-4 h-4 mr-2" />Invite User</Link></Button>
      </div>
      <DataTable columns={columns} data={(data ?? []) as UserProfile[]} total={data?.length ?? 0} emptyMessage="No users yet." />
    </div>
  )
}
