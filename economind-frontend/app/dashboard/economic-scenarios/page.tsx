'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PERSONA, PREDEFINED_SCENARIOS } from '@/lib/mock-data'
import { ScenarioBuilder } from '@/components/dashboard/scenario-builder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, ChevronDown } from 'lucide-react'

export default function ScenariosPage() {
  const router = useRouter()
  const [selectedScenario, setSelectedScenario] = useState(PREDEFINED_SCENARIOS[0])

  return (
        <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-medium mb-1">Economic Scenarios</h2>
        <p className="text-muted-foreground">
          Predefined and custom economic scenarios for testing consumer behavior
        </p>
      </div>

      {/* Scenario Builder */}
      <div className="card-glass">
        <ScenarioBuilder />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Predefined Scenarios</CardTitle>
          <CardDescription>Pick a ready-made scenario to preview and run</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <select
              value={selectedScenario.id}
              onChange={(e) => {
                const next = PREDEFINED_SCENARIOS.find((s) => s.id === e.target.value)
                if (next) setSelectedScenario(next)
              }}
              className="w-full appearance-none px-3.5 py-3 pr-10 rounded-lg border border-border bg-background text-sm font-medium cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/30 transition-colors"
            >
              {PREDEFINED_SCENARIOS.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <p className="text-sm text-muted-foreground mt-3">{selectedScenario.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Inflation</p>
              <p className="font-mono font-semibold text-sm mt-0.5">{selectedScenario.macro.inflation.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">GDP Growth</p>
              <p className="font-mono font-semibold text-sm mt-0.5">{selectedScenario.macro.gdpGrowth.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Unemployment</p>
              <p className="font-mono font-semibold text-sm mt-0.5">{selectedScenario.macro.unemployment.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Market Conf.</p>
              <p className="font-mono font-semibold text-sm mt-0.5">{selectedScenario.macro.marketConfidence.toFixed(0)}</p>
            </div>
          </div>

          <Button
            className="w-full gap-2 mt-5"
            onClick={() =>
              router.push(
                `/results?personaName=${encodeURIComponent(DEFAULT_PERSONA.name)}&scenarioId=${selectedScenario.id}`
              )
            }
          >
            <Play className="w-4 h-4" />
            Use Scenario
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
