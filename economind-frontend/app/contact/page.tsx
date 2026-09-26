import Link from 'next/link'
import { ArrowUpRight, Mail } from 'lucide-react'
import { SiteHeader } from '@/components/landing/site-header'
import { SiteFooter } from '@/components/landing/site-footer'

export default function ContactPage() {
  return (
    <main className="w-full">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Contact</p>
        <h1 className="font-heading text-4xl font-medium mb-4 tracking-tight">Get in touch</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          EconoMind is an educational research prototype, not a company with a support team — so
          there's no live inbox monitored around the clock. That said, if you have feedback or
          found a bug, this is the way to reach out:
        </p>

        <a
          href="mailto:yuva.chood@gmail.com"
          className="rounded-xl border border-border bg-card p-6 flex items-start gap-4 hover-glow group"
        >
          <Mail className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium mb-1 flex items-center gap-1.5">
              Email
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </h3>
            <p className="text-sm text-muted-foreground font-mono">yuva.chood@gmail.com</p>
          </div>
        </a>

        <p className="text-sm text-muted-foreground mt-10">
          Looking for the app itself? Head back to the{' '}
          <Link href="/dashboard" className="text-primary hover:underline">
            dashboard
          </Link>
          .
        </p>
      </div>
      <SiteFooter />
    </main>
  )
}
