'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DollarSign, Calendar, ShieldAlert, CheckSquare,
  LayoutDashboard, Bot, Settings, FolderOpen, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const modules = [
  { key: 'cost-control', label: 'Cost Control', icon: DollarSign },
  { key: 'planning',     label: 'Planning',      icon: Calendar     },
  { key: 'safety',       label: 'Safety',         icon: ShieldAlert  },
  { key: 'quality',      label: 'Quality',        icon: CheckSquare  },
]

interface AppSidebarProps {
  projectId: string | null
  isGlobalAdmin: boolean
  allowedModules?: string[] | null  // null = show all; array = filter to these slugs
}

export default function AppSidebar({ projectId, isGlobalAdmin, allowedModules = null }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const projectBase = projectId ? `/projects/${projectId}` : null

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/projects" className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-400" />
          <span className="font-semibold text-lg">PMO System</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Overview */}
        <SidebarLink href="/projects" icon={LayoutDashboard} label="Projects" active={pathname === '/projects'} />

        {/* Module links — only when a project is selected */}
        {projectBase && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Modules
            </div>
            {modules
              .filter(({ key }) => allowedModules === null || allowedModules.includes(key))
              .map(({ key, label, icon: Icon }) => {
                const href = `${projectBase}/${key}`
                return (
                  <SidebarLink
                    key={key}
                    href={href}
                    icon={Icon}
                    label={label}
                    active={pathname.startsWith(href)}
                  />
                )
              })}

            <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Project
            </div>
            <SidebarLink
              href={`${projectBase}/documents`}
              icon={FolderOpen}
              label="Documents"
              active={pathname === `${projectBase}/documents`}
            />
          </>
        )}

        {/* AI Assistant */}
        <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tools
        </div>
        <SidebarLink href="/ai-assistant" icon={Bot} label="AI Assistant" active={pathname.startsWith('/ai-assistant')} />

        {/* Admin */}
        {isGlobalAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administration
            </div>
            <SidebarLink href="/admin" icon={Settings} label="Admin Panel" active={pathname.startsWith('/admin')} />
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({
  href, icon: Icon, label, active
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </Link>
  )
}
