'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Download, Eye, FileText, Loader2, Search, X } from 'lucide-react'

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

export default function ReportsPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSimulations = simulations.filter((sim) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      sim.persona_name.toLowerCase().includes(query) ||
      sim.scenario_name.toLowerCase().includes(query) ||
      sim.summary.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    if (!token) return
    async function load() {
      try {
        const res = await fetch(`${API_URL}/simulations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.msg ?? 'Failed to load reports')
        setSimulations(data.simulations ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [token])

  const handleView = (sim: Simulation) => {
    // Map API shape back to the sessionStorage shape the results page expects
    const result = {
      summary: sim.summary,
      decisions: sim.decisions,
      confidence: sim.confidence,
      behavioralTraits: sim.behavioral_traits,
      theoryAlignment: sim.theory_alignment,
      reasoning: sim.reasoning,
    }
    sessionStorage.setItem('simulationResult', JSON.stringify(result))
    sessionStorage.setItem(
      'simulationMeta',
      JSON.stringify({ personaName: sim.persona_name, scenarioName: sim.scenario_name })
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
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${sim.persona_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-medium mb-1">Reports</h2>
        <p className="text-muted-foreground">
          All your saved simulation reports — click any to view or download
        </p>
      </div>

      {simulations.length > 0 && (
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by persona, scenario, or summary..."
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading reports…
        </div>
      ) : simulations.length === 0 ? (
        <div className="card-glass p-10 text-center space-y-4">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No reports yet.</p>
          <Button onClick={() => router.push('/dashboard')}>Run your first simulation</Button>
        </div>
      ) : filteredSimulations.length === 0 ? (
        <div className="card-glass p-10 text-center space-y-2">
          <Search className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No reports match &ldquo;{searchQuery}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSimulations.map((sim) => (
            <div key={sim.id} className="card-glass flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {sim.persona_name} — {sim.scenario_name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sim.summary}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {new Date(sim.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" title="View results" onClick={() => handleView(sim)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Download JSON" onClick={() => handleDownload(sim)}>
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
