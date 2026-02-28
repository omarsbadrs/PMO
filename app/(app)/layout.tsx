import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/helpers'

// Auth guard for all app routes.
// UI shell is in (shell)/layout.tsx (for top-level pages)
// or in projects/[projectId]/layout.tsx (for project detail pages).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
