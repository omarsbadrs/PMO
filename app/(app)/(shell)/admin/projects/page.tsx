import { requireGlobalAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AdminProjectsTable from '@/components/admin/AdminProjectsTable'
import type { Project } from '@/types/app'

export default async function AdminProjectsPage() {
  await requireGlobalAdmin()
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Projects</h1></div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="w-4 h-4 mr-2" />New Project
          </Link>
        </Button>
      </div>
      <AdminProjectsTable data={(data ?? []) as Project[]} />
    </div>
  )
}
