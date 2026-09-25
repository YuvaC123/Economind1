'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings, User, Bell, Database, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

const MENU_ITEMS = [
  { icon: User, label: 'Account', href: '/dashboard/settings#account' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/settings#notifications' },
  { icon: Database, label: 'Data & export', href: '/dashboard/settings#data-export' },
]

export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { signout } = useAuth()

  const handleSignOut = () => {
    setOpen(false)
    signout()
    window.location.href = '/login'
  }

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" title="Settings" onClick={() => setOpen((o) => !o)}>
        <Settings className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-64 bg-popover rounded-xl border border-border shadow-lg z-50 overflow-hidden origin-top-right"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Settings</p>
            </div>
            <div className="py-1.5">
              {MENU_ITEMS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05, ease: 'easeOut' }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors duration-150"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="border-t border-border py-1.5">
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-primary hover:bg-muted transition-colors duration-150"
              >
                <span>All settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="border-t border-border py-1.5">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
