'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, ShieldCheck } from 'lucide-react'
import { AdminSidebar } from '@/components/promptguard/admin-sidebar'
import { isAuthenticated, logout } from '@/lib/promptguard/auth'
import { getAdminStats } from '@/lib/api/admin'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === '/admin/login'
  const [ready, setReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (isLogin) {
      setReady(true)
      return () => {
        cancelled = true
      }
    }

    async function verifyAdminAccess() {
      if (!isAuthenticated()) {
        router.replace('/admin/login')
        return
      }

      try {
        await getAdminStats()
        if (!cancelled) setReady(true)
      } catch {
        logout()
        if (!cancelled) router.replace('/admin/login')
      }
    }

    void verifyAdminAccess()
    return () => {
      cancelled = true
    }
  }, [isLogin, pathname, router])

  if (isLogin) return <>{children}</>

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 animate-pulse text-primary" />
          Securing session…
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">PromptGuard SOC</span>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
