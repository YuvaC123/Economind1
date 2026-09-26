'use client'

import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorialButton } from '@/components/dashboard/tutorial-modal'
import { NotificationsButton } from '@/components/layouts/notifications-button'
import { ExportButton } from '@/components/layouts/export-button'
import { SettingsMenu } from '@/components/layouts/settings-menu'

export function TopNav() {
  const router = useRouter()

  return (
    <header className="flex-shrink-0 rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_20px_-6px_rgba(0,0,0,0.32)] h-16">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-medium">Dashboard</h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <TutorialButton />

          <NotificationsButton />

          <ExportButton />

          <div className="w-px h-6 bg-border hidden sm:block" />

          <Button onClick={() => router.push('/results')} className="gap-2 hidden sm:flex" size="sm">
            <Play className="w-4 h-4" />
            Run Simulation
          </Button>

          <SettingsMenu />
        </div>
      </div>
    </header>
  )
}
