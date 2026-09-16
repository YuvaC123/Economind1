'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import { Bell, CheckCircle2, TrendingUp, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    icon: CheckCircle2,
    title: 'Simulation completed',
    detail: 'John Doe under Low Inflation Economy finished with 87% accuracy',
    time: '2h ago',
    unread: true,
  },
  {
    id: 2,
    icon: FileText,
    title: 'Report generated',
    detail: 'Q4 Consumer Behavior Analysis is ready to view',
    time: '1d ago',
    unread: true,
  },
  {
    id: 3,
    icon: TrendingUp,
    title: 'Market confidence shifted',
    detail: 'AI Revolution Boom scenario confidence rose to 85',
    time: '2d ago',
    unread: false,
  },
]

const DISMISS_THRESHOLD = 90

function NotificationRow({
  notification,
  index,
  onDismiss,
}: {
  notification: (typeof INITIAL_NOTIFICATIONS)[number]
  index: number
  onDismiss: (id: number) => void
}) {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({ opacity: 1, x: 0 }, { delay: index * 0.05, duration: 0.2 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      initial={{ opacity: 0 }}
      animate={controls}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > DISMISS_THRESHOLD) {
          controls
            .start({ x: info.offset.x > 0 ? 400 : -400, opacity: 0 }, { duration: 0.2 })
            .then(() => onDismiss(notification.id))
        } else {
          // Spring back to center, animejs-Draggable style.
          controls.start({ x: 0 }, { type: 'spring', stiffness: 500, damping: 22 })
        }
      }}
      className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors duration-150 cursor-grab active:cursor-grabbing bg-popover"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 pointer-events-none">
        <notification.icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 pointer-events-none">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{notification.detail}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{notification.time}</p>
      </div>
    </motion.div>
  )
}

export function NotificationsButton() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [unreadCount, setUnreadCount] = useState(
    INITIAL_NOTIFICATIONS.filter((n) => n.unread).length
  )
  const ref = useRef<HTMLDivElement>(null)

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

  const handleDismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        title="Notifications"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) setUnreadCount(0)
        }}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 bg-popover rounded-xl border border-border shadow-lg z-50 overflow-hidden origin-top-right"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">Notifications</p>
              {notifications.length > 0 && (
                <p className="text-[11px] text-muted-foreground">Drag to dismiss</p>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <X className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">You&apos;re all caught up</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <NotificationRow key={n.id} notification={n} index={i} onDismiss={handleDismiss} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
