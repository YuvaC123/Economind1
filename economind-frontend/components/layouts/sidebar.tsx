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
      className="relative h-full flex-shrink-0 flex flex-col rounded-2xl border border-border bg-sidebar shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_20px_-6px_rgba(0,0,0,0.32)] transition-[width] duration-200"
      style={{ width: isOpen ? 264 : 76 }}
    >
      {/* Logo Section */}
      <Link
        href="/"
        className="h-16 flex items-center gap-3 px-4 border-b border-border cursor-pointer hover:bg-muted transition-colors duration-150"
      >
        <Brain className="w-5 h-5 flex-shrink-0 text-primary" />
        {isOpen && (
          <span className="font-heading font-medium text-base whitespace-nowrap">EconoMind</span>
        )}
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-sm transition-colors duration-150 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-0.5 before:rounded-full before:transition-opacity before:duration-150 ${
                  isActive
                    ? 'text-foreground font-medium before:bg-primary before:opacity-100'
                    : 'text-muted-foreground hover:text-foreground before:opacity-0'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
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
