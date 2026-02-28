import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AiChatInterface from '@/components/ai-assistant/ChatInterface'

export default async function AiAssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_global_admin, role')
    .eq('id', user.id)
    .single()

  const isElevated = profile?.is_global_admin || profile?.role === 'admin' || profile?.role === 'manager'
  const projectClient = isElevated ? createAdminClient() : supabase

  const { data: projects } = await projectClient
    .from('projects')
    .select('id, name, code')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">Ask questions about your projects using natural language</p>
      </div>
      <AiChatInterface projects={projects ?? []} />
    </div>
  )
}
