import { SiteHeader } from '@/components/landing/site-header'
import { SiteFooter } from '@/components/landing/site-footer'

export default function PrivacyPage() {
  return (
    <main className="w-full">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Privacy</p>
        <h1 className="font-heading text-4xl font-medium mb-4 tracking-tight">Privacy</h1>
        <p className="text-muted-foreground mb-10">
          Short version: there's very little to disclose, because there's very little happening
          on a server.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-heading text-xl font-medium mb-2">No account data is stored</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Log in and Sign up forms don't check credentials against a database or create a
              real account — there's no backend or database behind this app. Personas, scenarios
              you create, and settings changes exist only in your browser's memory for the current
              session and are lost on refresh.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-medium mb-2">Exports stay on your device</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Buttons like "Export Data" or "Download" generate a file locally in your browser and
              save it to your device. Nothing is uploaded anywhere.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-medium mb-2">Analytics</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This app includes Vercel Analytics, which — when deployed to production — collects
              anonymous, aggregate page-view data (no cookies, no personal identifiers). It's
              disabled entirely in local development.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-medium mb-2">Third parties</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No data is sold or shared, because none is collected beyond the anonymous analytics
              above.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
