'use client'

import Link from 'next/link'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorialButton } from '@/components/dashboard/tutorial-modal'
import { NotificationsButton } from '@/components/layouts/notifications-button'
import { ExportButton } from '@/components/layouts/export-button'
import { SettingsMenu } from '@/components/layouts/settings-menu'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading font-medium text-base cursor-pointer hover:text-primary transition-colors duration-150"
        >
          <Brain className="w-5 h-5 text-primary" />
          EconoMind
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TutorialButton />
          <NotificationsButton />
          <ExportButton />

          <div className="w-px h-6 bg-border hidden sm:block" />

          <SettingsMenu />

          <div className="w-px h-6 bg-border hidden sm:block" />

          <Link href="/login">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>

          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
