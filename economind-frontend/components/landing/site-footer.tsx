'use client'

import Link from 'next/link'
import { Brain } from 'lucide-react'

const columns = [
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/documentation' },
      { label: 'Research Reports', href: '/dashboard/reports' },
      { label: 'Methodology', href: '/methodology' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 font-heading font-medium text-base mb-2">
              <Brain className="w-5 h-5 text-primary" />
              EconoMind
            </div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-5">
              About
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              EconoMind is a research tool for modeling how different consumer personas respond to
              changing economic conditions. It pairs configurable demographic and behavioral
              profiles with adjustable macroeconomic scenarios to help researchers, economists, and
              educators explore decision-making under uncertainty.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} EconoMind. Built for educational and research purposes.
          </p>
          <p className="text-xs text-muted-foreground">Not affiliated with any financial institution.</p>
        </div>
      </div>
    </footer>
  )
}
