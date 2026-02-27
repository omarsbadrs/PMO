import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleRole } from '@/lib/auth/helpers'
import DocumentsSection from '@/components/shared/DocumentsSection'
import type { Document } from '@/types/app'

interface Props { params: Promise<{ projectId: string }> }

export default async function CostControlDocumentsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: docs }, role] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('module_key', 'cost_control')
      .order('uploaded_at', { ascending: false }),
    getUserModuleRole(projectId, 'cost_control'),
  ])

  const canUpload = role ? ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(role) : false

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Cost Control — Documents</h1>
        <p className="text-sm text-gray-500">All documents in this module</p>
      </div>
      <DocumentsSection
        projectId={projectId}
        moduleKey="cost_control"
        canUpload={canUpload}
        initialDocuments={(docs ?? []) as Document[]}
      />
    </div>
  )
}
