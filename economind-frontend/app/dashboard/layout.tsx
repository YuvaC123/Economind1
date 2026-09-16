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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? '280px' : '80px',
          marginRight: rightPanelOpen ? '352px' : '0px',
        }}
      >
        {/* Top Nav */}
        <TopNav sidebarOpen={sidebarOpen} />

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto pt-16 pb-6 px-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Right Panel */}
      <RightPanel isOpen={rightPanelOpen} onToggle={() => setRightPanelOpen(false)} />

      {/* Reopen button - only shown when the panel is closed, since the panel
          has its own inline collapse control when open */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-0 top-20 z-40 bg-card p-2 hover:bg-muted transition-colors border border-border rounded-l-lg hover-glow"
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
