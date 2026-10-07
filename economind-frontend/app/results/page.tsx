'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Download, Share2, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTransition } from '@/components/shared/page-transition'
import { InfoIconButton } from '@/components/shared/info-icon-button'
import { PhillipsCurveChart } from '@/components/charts/phillips-curve-chart'

// The LLM's JSON response isn't strictly typed - a field can come back as a
// string, be missing, or be out of range. Never trust it enough to call
// .toFixed() directly; always coerce through here first.
function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// Plain-language definitions for the jargon-heavy keys the LLM returns.
// Falls back to a generic line for any key not in this map (the model
// occasionally varies its exact field names).
const TRAIT_DEFINITIONS: Record<string, string> = {
  riskTolerance: "How comfortable this consumer is with uncertain outcomes — higher means they'll accept more risk for potential reward.",
  futureOrientation: 'How much weight they give to future outcomes versus immediate gratification.',
  impulsivity: 'How likely they are to make quick, unplanned financial decisions rather than deliberate ones.',
  socialConformity: "How much their decisions are swayed by what peers or the broader market are doing, rather than independent judgment.",
}

const THEORY_DEFINITIONS: Record<string, string> = {
  rationalChoice: 'Classical economics: consumers make decisions that maximize their own utility using all available information.',
  behavioralEconomics: 'Real decisions are shaped by cognitive biases and heuristics, not pure rational calculation.',
  keynesianEconomics: 'Spending is driven primarily by current income — consumption rises and falls with take-home pay.',
  austrianEconomics: 'Emphasizes individual choice, time preference, and skepticism of aggregate economic planning.',
  phillipsCurve: "How closely this scenario's inflation matches what the classic inflation/unemployment trade-off would predict — calculated directly from the scenario's own numbers, not estimated by the AI.",
}

function definitionFor(map: Record<string, string>, key: string): string {
  return map[key] ?? 'A model-estimated score for this factor, from 0 (low) to 100 (high).'
}

function ResultsContent() {
  const router = useRouter()

  const [result, setResult] = useState<any>(null)
  const [personaName, setPersonaName] = useState('')
  const [scenarioName, setScenarioName] = useState('')

  const [copied, setCopied] = useState(false)
  const [exported, setExported] = useState(false)
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({})
  const toggleHint = (key: string) => setOpenHints((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    const storedResult = sessionStorage.getItem('simulationResult')
    const storedMeta = sessionStorage.getItem('simulationMeta')

    if (!storedResult || !storedMeta) {
      router.push('/dashboard')
      return
    }

    setResult(JSON.parse(storedResult))

    const meta = JSON.parse(storedMeta)

    setPersonaName(meta.personaName)
    setScenarioName(meta.scenarioName)
  }, [router])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // clipboard access denied — the URL itself is still shareable manually
    }

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1800)
  }

  const handleExport = () => {
    const payload = {
      personaName,
      scenario: scenarioName,
      result,
    }

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `results-${personaName
      .toLowerCase()
      .replace(/\s+/g, '-')}-${Date.now()}.json`

    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExported(true)

    setTimeout(() => {
      setExported(false)
    }, 1800)
  }

  if (!result) {
    return <div className="min-h-screen" />
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground py-12">

        {/* Header */}
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          <h1 className="font-heading text-4xl font-medium mb-1">
            Simulation Results
          </h1>

          <p className="text-muted-foreground">
            Economic behavior analysis for {personaName} under{' '}
            {scenarioName}
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 space-y-6">

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>

              <CardDescription>
                Natural language analysis of consumer decision patterns
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {result.summary}
              </p>

              {Number.isFinite(result.monthlyIncome) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Based on a ${Math.round(safeNumber(result.annualIncomeMin)).toLocaleString()}–$
                    {Math.round(safeNumber(result.annualIncomeMax)).toLocaleString()}/yr income range
                    {' '}(${Math.round(safeNumber(result.annualIncome)).toLocaleString()}/yr at the midpoint) —
                    every dollar figure below is a <span className="font-semibold">monthly</span> amount, and
                    spending + saving + investing is balanced to equal <span className="font-semibold">net</span> monthly
                    income + borrowing, not gross.
                  </p>

                  {Number.isFinite(result.estimatedTaxRate) && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Gross /mo</p>
                        <p className="text-sm font-mono font-semibold mt-0.5">
                          ${Math.round(safeNumber(result.monthlyIncomeGross)).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Est. tax</p>
                        <p className="text-sm font-mono font-semibold mt-0.5 text-red-400">
                          −{(safeNumber(result.estimatedTaxRate) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Net /mo</p>
                        <p className="text-sm font-mono font-semibold mt-0.5 text-primary">
                          ${Math.round(safeNumber(result.monthlyIncome)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    Tax is a simplified estimate (US federal single-filer brackets + standard
                    deduction only — no state tax, credits, or deductions) for simulation
                    purposes, not tax advice.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decision Summary — all figures are monthly dollar amounts */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-sm font-medium text-muted-foreground">Monthly decisions</p>
              <InfoIconButton
                open={!!openHints.confidence}
                onToggle={() => toggleHint('confidence')}
                label="Confidence"
              />
            </div>
            <AnimatePresence initial={false}>
              {openHints.confidence && (
                <motion.p
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="text-xs text-muted-foreground leading-relaxed overflow-hidden -mt-1"
                >
                  Each tile&apos;s &quot;Confidence&quot; is the model&apos;s self-reported confidence in that
                  specific decision — not a probability that the outcome will happen.
                </motion.p>
              )}
            </AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Spending',
                value: `$${safeNumber(result.decisions?.spending).toFixed(0)}`,
                confidence: `${(safeNumber(result.confidence?.spending, 0.75) * 100).toFixed(0)}%`,
              },
              {
                label: 'Saving',
                value: `$${safeNumber(result.decisions?.saving).toFixed(0)}`,
                confidence: `${(safeNumber(result.confidence?.saving, 0.75) * 100).toFixed(0)}%`,
              },
              {
                label: 'Borrowing',
                value: `$${safeNumber(result.decisions?.borrowing).toFixed(0)}`,
                confidence: `${(safeNumber(result.confidence?.borrowing, 0.75) * 100).toFixed(0)}%`,
              },
              {
                label: 'Investing',
                value: `$${safeNumber(result.decisions?.investing).toFixed(0)}`,
                confidence: `${(safeNumber(result.confidence?.investing, 0.75) * 100).toFixed(0)}%`,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="card-glass"
              >
                <p className="text-sm text-muted-foreground truncate" title={item.label}>
                  {item.label}
                </p>

                <p className="text-4xl font-mono font-semibold tracking-tight text-primary mt-2">
                  {item.value}
                  <span className="text-sm font-medium text-muted-foreground ml-1.5">/mo</span>
                </p>

                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Confidence: {item.confidence}
                </p>
              </div>
            ))}
            </div>
          </div>

          {/* Decision Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>
                Consumer Decisions Timeline
              </CardTitle>

              <CardDescription>
                Sequence of economic decisions and rationale
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {result.reasoning.map(
                  (reason: string, i: number) => (
                    <div
                      key={i}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                      </div>

                      <div className="flex-1 pt-1">
                        <p className="text-sm">
                          {reason}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Traits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <Card>
              <CardHeader>
                <CardTitle>
                  Behavioral Traits
                </CardTitle>

                <CardDescription>
                  Consumer psychology metrics
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    result.behavioralTraits
                  ).map(([key, value]) => {
                    const parsed = Number(value)
                    const numericValue = Number.isFinite(parsed)
                      ? Math.min(100, Math.max(0, parsed))
                      : 0
                    const hintKey = `trait-${key}`
                    const readableLabel = key
                      .replace(/[_-]/g, ' ')
                      .replace(/([A-Z])/g, ' $1')
                      .trim()

                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <span className="flex items-center gap-1 text-sm font-medium capitalize">
                            {readableLabel}
                            <InfoIconButton
                              open={!!openHints[hintKey]}
                              onToggle={() => toggleHint(hintKey)}
                              label={readableLabel}
                            />
                          </span>

                          <span className="text-sm font-mono font-semibold flex-shrink-0">
                            {numericValue.toFixed(0)}%
                          </span>
                        </div>

                        <AnimatePresence initial={false}>
                          {openHints[hintKey] && (
                            <motion.p
                              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
                              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                              className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                            >
                              {definitionFor(TRAIT_DEFINITIONS, key)}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{
                              width: `${numericValue}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Theory Alignment */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Theory Alignment
                </CardTitle>

                <CardDescription>
                  Economic theory fit analysis
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    result.theoryAlignment
                  ).map(([key, value]) => {
                    const parsed = Number(value)
                    const numericValue = Number.isFinite(parsed)
                      ? Math.min(100, Math.max(0, parsed))
                      : 0
                    const hintKey = `theory-${key}`
                    const readableLabel = key
                      .replace(/[_-]/g, ' ')
                      .replace(/([A-Z])/g, ' $1')
                      .trim()

                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <span className="flex items-center gap-1 text-sm font-medium capitalize">
                            {readableLabel}
                            <InfoIconButton
                              open={!!openHints[hintKey]}
                              onToggle={() => toggleHint(hintKey)}
                              label={readableLabel}
                            />
                          </span>

                          <span className="text-sm font-mono font-semibold flex-shrink-0">
                            {numericValue.toFixed(0)}%
                          </span>
                        </div>

                        <AnimatePresence initial={false}>
                          {openHints[hintKey] && (
                            <motion.p
                              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
                              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                              className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                            >
                              {definitionFor(THEORY_DEFINITIONS, key)}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{
                              width: `${numericValue}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Phillips Curve */}
          {result.phillipsCurve && Number.isFinite(result.phillipsCurve.unemploymentRate) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Phillips Curve</CardTitle>
                  <InfoIconButton
                    open={!!openHints.phillipsCurveChart}
                    onToggle={() => toggleHint('phillipsCurveChart')}
                    label="Phillips Curve"
                  />
                </div>
                <CardDescription>
                  The classic trade-off between unemployment and inflation, applied to this scenario
                </CardDescription>
                <AnimatePresence initial={false}>
                  {openHints.phillipsCurveChart && (
                    <motion.p
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                    >
                      The short-run Phillips Curve says inflation tends to run hot when unemployment is low
                      (a tight labor market) and cool off when unemployment is high (slack). The purple dot
                      is this scenario&apos;s actual unemployment and inflation; the grey dot is what the
                      curve predicts inflation should be at that unemployment rate. A big gap between them
                      means this scenario doesn&apos;t fit the classic trade-off well — e.g. high inflation
                      <em> and</em> high unemployment together (&quot;stagflation&quot;) sits far above the
                      curve.
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardHeader>

              <CardContent>
                <PhillipsCurveChart
                  unemploymentRate={safeNumber(result.phillipsCurve.unemploymentRate)}
                  actualInflation={safeNumber(result.phillipsCurve.actualInflation)}
                  expectedInflation={safeNumber(result.phillipsCurve.expectedInflation)}
                />
                <p className="text-xs text-muted-foreground mt-3">
                  {Math.abs(safeNumber(result.phillipsCurve.gap)) < 0.5
                    ? 'This scenario sits almost exactly on the theoretical curve.'
                    : safeNumber(result.phillipsCurve.gap) > 0
                      ? `Inflation is running ${Math.abs(safeNumber(result.phillipsCurve.gap)).toFixed(1)} points hotter than the curve predicts for this unemployment rate — a stagflation-like pressure.`
                      : `Inflation is running ${Math.abs(safeNumber(result.phillipsCurve.gap)).toFixed(1)} points cooler than the curve predicts — more slack than the classic trade-off would suggest.`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Export Section */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleShare}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}

              {copied
                ? 'Link copied'
                : 'Share Results'}
            </Button>

            <Button
              className="gap-2"
              onClick={handleExport}
            >
              {exported ? (
                <Check className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}

              {exported
                ? 'Exported'
                : 'Export Report'}
            </Button>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" />
      }
    >
      <ResultsContent />
    </Suspense>
  )
}