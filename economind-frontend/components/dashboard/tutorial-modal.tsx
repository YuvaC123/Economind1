'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  HelpCircle,
  X,
  ArrowRight,
  ArrowLeft,
  User,
  Globe,
  Play,
  Sparkles,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const RISK_LABELS: Record<number, string> = {
  0: 'Very conservative — avoids risk almost entirely',
  1: 'Conservative — prefers safe, stable returns',
  2: 'Moderate — balances safety with growth',
  3: 'Aggressive — comfortable with volatility for higher returns',
  4: 'Very aggressive — chases maximum growth',
}

const DEMO_SCENARIOS = [
  { id: 'stable', label: 'Stable growth', inflation: 2.5, unemployment: 4.0, confidence: 72 },
  { id: 'recession', label: 'Recession', inflation: 1.5, unemployment: 7.5, confidence: 28 },
  { id: 'inflation', label: 'High inflation', inflation: 6.0, unemployment: 5.0, confidence: 45 },
]

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to EconoMind',
    body: 'EconoMind simulates how different consumer personas make economic decisions under changing macroeconomic conditions. Here is what you can do:',
    bullets: [
      'Build detailed consumer personas with real financial and behavioral traits',
      'Configure macroeconomic scenarios, from stable growth to recession',
      'Run simulations and see how theory predictions compare to behavior',
    ],
  },
  {
    icon: User,
    title: 'Build a persona',
    body: 'Every persona has demographics, finances, and six behavioral traits that drive its decisions. Try dragging this risk aversion slider to see how the read-out changes:',
    interactive: 'persona' as const,
  },
  {
    icon: Globe,
    title: 'Configure a scenario',
    body: 'Pick a preset economic condition or fine-tune inflation, interest rates, and volatility yourself. Click a preset below to see how the environment shifts:',
    interactive: 'scenario' as const,
  },
  {
    icon: Play,
    title: 'Run & analyze',
    body: 'Running a simulation produces four decisions, each with a confidence score, plus alignment against major economic theories:',
    bullets: ['Spending', 'Saving', 'Borrowing', 'Investing'],
    interactive: 'results' as const,
  },
]

export function TutorialButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [riskValue, setRiskValue] = useState([2])
  const [demoScenario, setDemoScenario] = useState(DEMO_SCENARIOS[0])

  const close = () => {
    setOpen(false)
    setStep(0)
  }

  const goTo = (destination: string) => {
    close()
    router.push(destination)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const isLast = step === STEPS.length
  const current = STEPS[step]
  const Icon = current?.icon ?? Check
  const totalSteps = STEPS.length + 1

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Tutorial</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close tutorial"
            className="absolute inset-0 bg-foreground/20 cursor-pointer"
            onClick={close}
          />

          <div className="relative bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={close}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors hover-glow"
              aria-label="Close tutorial"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-primary" />
            </div>

            <p className="text-xs font-medium text-muted-foreground mb-1">
              Step {step + 1} of {totalSteps}
            </p>

            {!isLast ? (
              <>
                <h3 className="font-semibold mb-2">{current.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{current.body}</p>

                {current.bullets && (
                  <ul className="space-y-2 mb-4">
                    {current.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {current.interactive === 'persona' && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Risk aversion</span>
                      <span className="text-xs font-semibold text-primary">{riskValue[0]} / 4</span>
                    </div>
                    <Slider
                      value={riskValue}
                      onValueChange={(v) => setRiskValue(Array.isArray(v) ? [v[0]] : [v as number])}
                      min={0}
                      max={4}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground mt-3">{RISK_LABELS[riskValue[0]]}</p>
                  </div>
                )}

                {current.interactive === 'scenario' && (
                  <div className="mb-2">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {DEMO_SCENARIOS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setDemoScenario(s)}
                          className={`px-2 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-150 hover-glow ${
                            demoScenario.id === s.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-3 grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Inflation</p>
                        <p className="text-sm font-semibold">{demoScenario.inflation.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unemployment</p>
                        <p className="text-sm font-semibold">{demoScenario.unemployment.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {current.interactive === 'results' && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4 mb-2 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rational choice alignment</span>
                      <span className="font-semibold">71%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '71%' }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="font-semibold mb-2">You&apos;re ready to go</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Jump straight into building your first persona or exploring economic scenarios —
                  or head to the dashboard and explore at your own pace.
                </p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="justify-between" onClick={() => goTo('/dashboard/persona-builder')}>
                    Build a persona
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-between"
                    onClick={() => goTo('/dashboard/economic-scenarios')}
                  >
                    Explore scenarios
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            )}

            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-colors duration-150 hover-glow ${
                      i === step ? 'bg-primary' : 'bg-muted hover:bg-primary/40'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                )}
                {isLast ? (
                  <Button variant="outline" size="sm" onClick={close}>
                    Close
                  </Button>
                ) : (
                  <Button size="sm" className="gap-1.5" onClick={() => setStep((s) => s + 1)}>
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
