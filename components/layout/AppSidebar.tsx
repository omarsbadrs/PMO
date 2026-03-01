'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  DollarSign, Calendar, ShieldAlert, CheckSquare,
  LayoutDashboard, Bot, Settings, FolderOpen, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const modules = [
  { key: 'cost-control', label: 'Cost Control', icon: DollarSign },
  { key: 'planning',     label: 'Planning',      icon: Calendar    },
  { key: 'safety',       label: 'Safety',        icon: ShieldAlert },
  { key: 'quality',      label: 'Quality',       icon: CheckSquare },
]

interface AppSidebarProps {
  projectId: string | null
  isGlobalAdmin: boolean
  allowedModules?: string[] | null
}

export default function AppSidebar({ projectId, isGlobalAdmin, allowedModules = null }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  // Persist preference
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  function toggle() {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const projectBase = projectId ? `/projects/${projectId}` : null
  const c = collapsed

  return (
    <aside
      className={cn(
        'bg-gray-900 text-white flex flex-col min-h-screen transition-all duration-300 ease-in-out shrink-0',
        c ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo + toggle */}
      <div className={cn('flex items-center border-b border-gray-700 h-16', c ? 'justify-center px-2' : 'px-5 gap-2')}>
        {!c && (
          <Link href="/projects" className="flex items-center gap-2 flex-1 min-w-0">
            <LayoutDashboard className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="font-semibold text-base truncate">PMO System</span>
          </Link>
        )}
        <button
          onClick={toggle}
          title={c ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          {c ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {/* Projects */}
        {!c && <SectionLabel label="Overview" />}
        <NavLink href="/projects" icon={LayoutDashboard} label="Projects" active={pathname === '/projects'} collapsed={c} />

        {/* Project-specific */}
        {projectBase && (
          <>
            {!c && <SectionLabel label="Project" />}
            <NavLink href={projectBase} icon={LayoutDashboard} label="Dashboard" active={pathname === projectBase} collapsed={c} />
            {!c && <SectionLabel label="Modules" />}
            {modules
              .filter(({ key }) => allowedModules === null || allowedModules.includes(key))
              .map(({ key, label, icon: Icon }) => {
                const href = `${projectBase}/${key}`
                return (
                  <NavLink key={key} href={href} icon={Icon} label={label} active={pathname.startsWith(href)} collapsed={c} />
                )
              })}
            <NavLink href={`${projectBase}/documents`} icon={FolderOpen} label="Documents" active={pathname === `${projectBase}/documents`} collapsed={c} />
          </>
        )}

        {/* Tools */}
        {!c && <SectionLabel label="Tools" />}
        <NavLink href="/ai-assistant" icon={Bot} label="AI Assistant" active={pathname.startsWith('/ai-assistant')} collapsed={c} />

        {/* Admin */}
        {isGlobalAdmin && (
          <>
            {!c && <SectionLabel label="Administration" />}
            <NavLink href="/admin" icon={Settings} label="Admin Panel" active={pathname.startsWith('/admin')} collapsed={c} />
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className={cn('border-t border-gray-700', c ? 'p-2' : 'p-3')}>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className={cn(
            'flex items-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm w-full',
            c ? 'justify-center p-2' : 'gap-3 px-3 py-2',
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!c && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {label}
    </div>
  )
}

function NavLink({
  href, icon: Icon, label, active, collapsed,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center rounded-lg text-sm transition-colors mx-2 my-0.5',
        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700',
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && label}
    </Link>
  )
}
