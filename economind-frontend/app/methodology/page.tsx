import { SiteHeader } from '@/components/landing/site-header'
import { SiteFooter } from '@/components/landing/site-footer'

export default function MethodologyPage() {
  return (
    <main className="w-full">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Methodology</p>
        <h1 className="font-heading text-4xl font-medium mb-4 tracking-tight">
          How the numbers are generated
        </h1>
        <p className="text-muted-foreground mb-10">
          EconoMind is an educational tool, not a forecasting product. Here's exactly what's
          driving the numbers you see, so you can judge how much weight to give them.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-heading text-xl font-medium mb-2">Economic scenarios</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The 8 preset scenarios (Low Inflation Economy, Recession Conditions, AI Revolution
              Boom, Stagflation, and others) are fixed, hand-authored datasets covering inflation,
              interest rates, GDP growth, unemployment, wage growth, housing and energy prices, AI
              adoption, and market confidence. They don't come from a live economic data feed —
              they're static reference points chosen to be internally consistent and roughly
              plausible.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-medium mb-2">Simulation results</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you run a simulation, spending, saving, borrowing, and investing decisions,
              confidence scores, and economic theory alignments are generated live by EconoMind&apos;s
              behavioral economics LLM engine. The engine analyzes the consumer persona&apos;s financial
              profile and psychological traits against the macroeconomic scenario to synthesize realistic
              economic decision-making and rationale.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-medium mb-2">The scenario comparison tool</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The "Same economy, two very different stories" comparison on the home page is
              different — it linearly interpolates between the real, defined values of two
              scenarios (Recession Conditions and AI Revolution Boom) as you drag. Every value
              between the endpoints is mathematically real, not randomized.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-medium mb-2">Behavioral traits</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Risk aversion, loss aversion, time preference, rationality, herding behavior, and
              overconfidence scores shown in Persona Builder are fixed illustrative values meant
              to demonstrate how a behavioral profile could be displayed — they aren't derived
              from the persona's other fields.
            </p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
