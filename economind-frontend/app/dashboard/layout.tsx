'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layouts/sidebar'
import { TopNav } from '@/components/layouts/top-nav'
import { RightPanel } from '@/components/layouts/right-panel'
import { useAuth } from '@/lib/auth-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace('/login')
    }
  }, [isLoading, user])

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background p-4 gap-4 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Top Nav */}
        <TopNav />

        {/* Content row - main canvas + optional right panel, side by side */}
        <div className="flex-1 flex gap-4 min-h-0">
          <main className="flex-1 overflow-y-auto min-w-0 pb-2 px-1">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>

          {rightPanelOpen && (
            <RightPanel isOpen={rightPanelOpen} onToggle={() => setRightPanelOpen(false)} />
          )}
        </div>
      </div>

      {/* Reopen button - only shown when the panel is closed, since the panel
          has its own inline collapse control when open */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-4 top-20 z-40 bg-card p-2 hover:bg-muted transition-colors border border-border rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_20px_-6px_rgba(0,0,0,0.32)] hover-glow"
          title="Open insights"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
