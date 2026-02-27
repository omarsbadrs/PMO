import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleRole } from '@/lib/auth/helpers'
import DocumentsSection from '@/components/shared/DocumentsSection'
import type { Document, ModuleKey } from '@/types/app'

interface Props { params: Promise<{ projectId: string }> }

export default async function ProjectDocumentsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false })

  // Show upload for any module the user can write
  const modules: ModuleKey[] = ['cost_control', 'planning', 'safety', 'quality']
  const roles = await Promise.all(modules.map((m) => getUserModuleRole(projectId, m)))
  const canUpload = roles.some((r) => r && ['GLOBAL_ADMIN', 'MODULE_ADMIN', 'INPUT'].includes(r))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Project Documents</h1>
        <p className="text-sm text-gray-500">All documents across modules</p>
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
