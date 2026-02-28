import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/auth/helpers'
import AppSidebar from '@/components/layout/AppSidebar'
import Header from '@/components/layout/Header'
import type { UserProfile } from '@/types/app'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/login')
  if (profile.is_active === false) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar
        projectId={null}
        isGlobalAdmin={profile.is_global_admin || profile.role === 'admin'}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={profile as UserProfile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
