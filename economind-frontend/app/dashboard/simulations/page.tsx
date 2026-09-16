'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { CountUpNumber } from '@/components/shared/count-up-number'

import { Play, Download, Eye, Loader2 } from 'lucide-react'

import { useAuth } from '@/lib/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Simulation {
  id: string
  persona_name: string
  scenario_name: string
  summary: string
  decisions: Record<string, number>
  confidence: Record<string, number>
  behavioral_traits: Record<string, number>
  theory_alignment: Record<string, number>
  reasoning: string[]
  createdAt: string
}

export default function SimulationsPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    async function load() {
      try {
        const res = await fetch(`${API_URL}/simulations`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.msg ?? 'Failed to load simulations')
        }

        setSimulations(data.simulations ?? [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load simulations'
        )
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token])

  const avgConfidence = simulations.length
    ? Math.round(
        (simulations.reduce((sum, s) => {
          const vals = Object.values(s.confidence ?? {})

          return (
            sum +
            (vals.length
              ? vals.reduce((a, b) => a + b, 0) / vals.length
              : 0)
          )
        }, 0) /
          simulations.length) *
          100
      )
    : 0

  const handleView = (sim: Simulation) => {
    const result = {
      summary: sim.summary,
      decisions: sim.decisions,
      confidence: sim.confidence,
      behavioralTraits: sim.behavioral_traits,
      theoryAlignment: sim.theory_alignment,
      reasoning: sim.reasoning,
    }

    sessionStorage.setItem(
      'simulationResult',
      JSON.stringify(result)
    )

    sessionStorage.setItem(
      'simulationMeta',
      JSON.stringify({
        personaName: sim.persona_name,
        scenarioName: sim.scenario_name,
      })
    )

    router.push('/results')
  }

  const handleDownload = (sim: Simulation) => {
    const payload = {
      personaName: sim.persona_name,
      scenario: sim.scenario_name,
      date: sim.createdAt,
      result: {
        summary: sim.summary,
        decisions: sim.decisions,
        confidence: sim.confidence,
        behavioralTraits: sim.behavioral_traits,
        theoryAlignment: sim.theory_alignment,
        reasoning: sim.reasoning,
      },
    }

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `simulation-${sim.id}.json`

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-medium mb-1">
          Simulations
        </h2>

        <p className="text-muted-foreground">
          View and manage your economic behavior simulations
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          className="gap-2"
          onClick={() => router.push('/dashboard')}
        >
          <Play className="w-4 h-4" />
          New Simulation
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass text-center">
          <p className="text-2xl font-mono font-semibold text-primary">
            <CountUpNumber target={simulations.length} />
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            Total Simulations
          </p>
        </div>

        <div className="card-glass text-center">
          <p className="text-2xl font-mono font-semibold text-primary">
            <CountUpNumber target={simulations.length} />
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            Completed
          </p>
        </div>

        <div className="card-glass text-center">
          <p className="text-2xl font-mono font-semibold text-primary">
            <CountUpNumber
              target={avgConfidence}
              format={(n) => `${Math.round(n)}%`}
            />
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            Avg. Confidence
          </p>
        </div>

        <div className="card-glass text-center">
          <p className="text-2xl font-mono font-semibold text-primary">
            <CountUpNumber
              target={simulations.length > 0 ? 100 : 0}
              format={(n) => `${Math.round(n)}%`}
            />
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            Success Rate
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading simulations…
        </div>
      ) : simulations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No simulations yet — run one from the dashboard.
        </p>
      ) : (
        <div className="space-y-3">
          {simulations.map((sim) => (
            <div
              key={sim.id}
              className="card-glass flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {sim.persona_name} — {sim.scenario_name}
                </h3>

                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>
                    {new Date(sim.createdAt).toLocaleString()}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="View results"
                  onClick={() => handleView(sim)}
                >
                  <Eye className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  title="Download results"
                  onClick={() => handleDownload(sim)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}