import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewActualForm from './NewActualForm'

interface Props { params: Promise<{ projectId: string }> }

export default async function NewActualPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('currency')
    .eq('id', projectId)
    .single()

  return <NewActualForm projectId={projectId} defaultCurrency={project?.currency ?? 'USD'} />
}
