'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, User, Send, Loader2 } from 'lucide-react'
import type { Project } from '@/types/app'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const MODULE_OPTIONS = [
  { value: 'all',          label: 'All modules'  },
  { value: 'cost_control', label: 'Cost Control' },
  { value: 'planning',     label: 'Planning'     },
  { value: 'safety',       label: 'Safety'       },
  { value: 'quality',      label: 'Quality'      },
]

interface Props {
  projects: Pick<Project, 'id' | 'name' | 'code'>[]
}

export default function AiChatInterface({ projects }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [projectId, setProjectId] = useState<string>('all')
  const [moduleKey, setModuleKey] = useState('all')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Clear chat when the project changes so context is never mixed
  function handleProjectChange(newProjectId: string) {
    setProjectId(newProjectId)
    setMessages([])
    setInput('')
  }

  // Clear chat when the module scope changes
  function handleModuleChange(newModule: string) {
    setModuleKey(newModule)
    setMessages([])
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setStreaming(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        projectId,
        moduleKey: moduleKey !== 'all' ? moduleKey : undefined,
      }),
    })

    if (!res.ok || !res.body) {
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: 'Error: Could not get a response.' }
        return copy
      })
      setStreaming(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value, { stream: true })
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: accumulated }
        return copy
      })
    }

    setStreaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const isAllProjects = projectId === 'all'
  const selectedProject = projects.find((p) => p.id === projectId)
  const selectedModule = MODULE_OPTIONS.find((m) => m.value === moduleKey)
  const scopeLabel = isAllProjects ? 'All Projects' : (selectedProject?.name ?? '')

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl border overflow-hidden">

      {/* Scope selectors */}
      <div className="p-4 border-b bg-gray-50 flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Project:</span>
          <Select value={projectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-52 h-8 text-sm">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="font-medium text-blue-600">All Projects</span>
              </SelectItem>
              {projects.length === 0 && (
                <SelectItem value="_none" disabled>No projects available</SelectItem>
              )}
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-1.5 text-xs text-gray-400">{p.code}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Module:</span>
          <Select value={moduleKey} onValueChange={handleModuleChange}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              {MODULE_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active scope badge */}
        <span className="text-xs text-gray-400 ml-auto hidden sm:block">
          Scope: <span className="font-medium text-gray-600">{scopeLabel}</span>
          {' · '}
          <span className="font-medium text-gray-600">{selectedModule?.label}</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Bot className="w-10 h-10 mx-auto mb-3" />
            <p className="font-medium text-gray-600">PMO AI Assistant</p>
            <p className="text-sm mt-1">
              {isAllProjects
                ? `Asking across all projects · ${selectedModule?.label}`
                : selectedProject
                  ? `Asking about "${selectedProject.name}" · ${selectedModule?.label}`
                  : 'Select a project to begin'}
            </p>
            <p className="text-xs mt-3 text-gray-300">Ask about budgets, schedules, incidents, documents and more.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-white" />
              }
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {msg.content || (streaming && msg.role === 'assistant'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : ''
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAllProjects
              ? `Ask about all projects… (Enter to send, Shift+Enter for new line)`
              : `Ask about ${selectedProject?.name ?? 'this project'}… (Enter to send, Shift+Enter for new line)`
          }
          rows={2}
          className="resize-none"
          disabled={streaming}
        />
        <Button type="submit" disabled={!input.trim() || streaming} className="shrink-0">
          {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  )
}
