'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  Globe,
  Play,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: User, label: 'Persona Builder', href: '/dashboard/persona-builder' },
  { icon: Globe, label: 'Scenarios', href: '/dashboard/economic-scenarios' },
  { icon: Play, label: 'Simulations', href: '/dashboard/simulations' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: FileText, label: 'Reports', href: '/dashboard/reports' },
]

interface SidebarProps {
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-white/10 backdrop-blur-2xl [background:color-mix(in_oklch,white_4%,transparent)] transition-[width] duration-200"
      style={{ width: isOpen ? 280 : 80 }}
    >
      {/* Logo Section */}
      <Link
        href="/"
        className="h-16 flex items-center gap-3 px-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors duration-150"
      >
        <Brain className="w-5 h-5 flex-shrink-0 text-primary" />
        {isOpen && (
          <span className="font-heading font-medium text-base whitespace-nowrap bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
            EconoMind
          </span>
        )}
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/25 to-primary/5 text-primary font-medium shadow-[0_0_20px_-6px_var(--color-primary)] border border-primary/30'
                    : 'text-muted-foreground border border-transparent hover:bg-white/5 hover:text-foreground hover:translate-x-0.5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={() => onToggle?.(!isOpen)}
        className="absolute -right-3 bottom-20 rounded-full border border-border bg-card p-1.5 cursor-pointer hover:bg-muted hover:border-foreground/20 active:scale-90 transition-all duration-150 hover-glow"
      >
        {isOpen ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  )
}
