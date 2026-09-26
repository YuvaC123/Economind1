'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, Share2, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTransition } from '@/components/shared/page-transition'

function ResultsContent() {
  const router = useRouter()

  const [result, setResult] = useState<any>(null)
  const [personaName, setPersonaName] = useState('')
  const [scenarioName, setScenarioName] = useState('')

  const [copied, setCopied] = useState(false)
  const [exported, setExported] = useState(false)

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
            </CardContent>
          </Card>

          {/* Decision Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Monthly Spending',
                value: `$${result.decisions.spending.toFixed(0)}`,
                confidence: `${(
                  result.confidence.spending * 100
                ).toFixed(0)}%`,
              },
              {
                label: 'Savings',
                value: `$${result.decisions.saving.toFixed(0)}`,
                confidence: `${(
                  result.confidence.saving * 100
                ).toFixed(0)}%`,
              },
              {
                label: 'Borrowing',
                value: `$${result.decisions.borrowing.toFixed(0)}`,
                confidence: `${(
                  result.confidence.borrowing * 100
                ).toFixed(0)}%`,
              },
              {
                label: 'Investing',
                value: `$${result.decisions.investing.toFixed(0)}`,
                confidence: `${(
                  result.confidence.investing * 100
                ).toFixed(0)}%`,
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
                </p>

                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Confidence: {item.confidence}
                </p>
              </div>
            ))}
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

                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium capitalize">
                            {key
                              .replace(
                                /[_-]/g,
                                ' '
                              )
                              .replace(
                                /([A-Z])/g,
                                ' $1'
                              )
                              .trim()}
                          </span>

                          <span className="text-sm font-mono font-semibold">
                            {numericValue.toFixed(0)}%
                          </span>
                        </div>

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

                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium capitalize">
                            {key
                              .replace(
                                /[_-]/g,
                                ' '
                              )
                              .replace(
                                /([A-Z])/g,
                                ' $1'
                              )
                              .trim()}
                          </span>

                          <span className="text-sm font-mono font-semibold">
                            {numericValue.toFixed(0)}%
                          </span>
                        </div>

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