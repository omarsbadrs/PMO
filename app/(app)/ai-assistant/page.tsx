import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AiChatInterface from '@/components/ai-assistant/ChatInterface'
import type { Project } from '@/types/app'

export default async function AiAssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, code')
    .order('name')

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about your project data and uploaded documents
        </p>
      </div>
      <AiChatInterface projects={(projects ?? []) as Pick<Project, 'id' | 'name' | 'code'>[]} />
    </div>
  )
}
