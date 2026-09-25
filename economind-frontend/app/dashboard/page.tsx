'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PERSONA, PREDEFINED_SCENARIOS, Persona } from '@/lib/mock-data'
import { PersonaConfigCard } from '@/components/dashboard/persona-config-card'
import { MacroeconomicCard } from '@/components/dashboard/macroeconomic-card'
import { EditPersonaModal } from '@/components/dashboard/edit-persona-modal'
import { CountUpNumber } from '@/components/shared/count-up-number'
import { Button } from '@/components/ui/button'
import { Play, ChevronDown, Users, Plus, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ApiPersona {
  id: string
  name: string
  age: number
  gender?: string | null
  education?: string | null
  income: number
  wealth: number
  savings: number
  debt: number
  monthly_expenses: number
  risk_appetite: string
  spending_behavior?: string | null
  saving_preference?: string | null
  investment_preference?: string | null
}

function fromApiPersona(p: ApiPersona): Persona {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: (p.gender as Persona['gender']) ?? 'other',
    education: (p.education as Persona['education']) ?? 'bachelors',
    income: p.income,
    wealth: p.wealth,
    savings: p.savings,
    debt: p.debt,
    monthlyExpenses: p.monthly_expenses,
    riskAppetite: (p.risk_appetite as Persona['riskAppetite']) ?? 'moderate',
    spendingBehavior: (p.spending_behavior as Persona['spendingBehavior']) ?? 'balanced',
    savingPreference: (p.saving_preference as Persona['savingPreference']) ?? 'retirement',
    investmentPreference: (p.investment_preference as Persona['investmentPreference']) ?? 'diversified',
  }
}

interface SimulationHistoryItem {
  id: string
  personaName: string
  scenarioName: string
  result: any
  timestamp: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [selectedScenario, setSelectedScenario] = useState(PREDEFINED_SCENARIOS[0])
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA)
  const [userPersonas, setUserPersonas] = useState<Persona[]>([])
  const [isEditingPersona, setIsEditingPersona] = useState(false)

  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState('')
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>([])
  const [personaCount, setPersonaCount] = useState(0)
  const [simulationCount, setSimulationCount] = useState(0)

  useEffect(() => {
    const storedHistory = sessionStorage.getItem('simulationHistory')
    if (storedHistory) {
      setSimulationHistory(JSON.parse(storedHistory))
    }
  }, [])

  // Load real personas and stats
  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch(`${API_URL}/personas`, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
        r.json()
      ),
      fetch(`${API_URL}/simulations`, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
        r.json()
      ),
    ])
      .then(([p, s]) => {
        if (p.personas && Array.isArray(p.personas)) {
          const mapped = p.personas.map(fromApiPersona)
          setUserPersonas(mapped)
          setPersonaCount(mapped.length)
          if (mapped.length > 0) {
            setPersona(mapped[0])
          }
        }
        setSimulationCount(s.simulations?.length ?? 0)
      })
      .catch(() => {})
  }, [token])

  const handleRunSimulation = async () => {
    setIsSimulating(true)
    setError('')

    try {
      const authToken = token || localStorage.getItem('em_token')
      if (!authToken) {
        throw new Error('You are not logged in. Please refresh or log in again.')
      }

      const response = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          persona_name: persona.name,
          scenario_name: selectedScenario.name,
          persona: {
            name: persona.name,
            age: persona.age,
            income: persona.income,
            savings: persona.savings,
            wealth: persona.wealth,
            debt: persona.debt,
            monthly_expenses: persona.monthlyExpenses,
            risk_appetite: persona.riskAppetite,
          },
          scenario: {
            name: selectedScenario.name,
            description: selectedScenario.description,
            inflation: selectedScenario.macro.inflation,
            interestRate: selectedScenario.macro.interestRate,
            gdpGrowth: selectedScenario.macro.gdpGrowth,
            unemployment: selectedScenario.macro.unemployment,
            wageGrowth: selectedScenario.macro.wageGrowth,
            housingPrices: selectedScenario.macro.housingPrices,
            energyPrices: selectedScenario.macro.energyPrices,
            aiAdoption: selectedScenario.macro.aiAdoption,
            marketConfidence: selectedScenario.macro.marketConfidence,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.msg || `Simulation failed (Status ${response.status})`)
      }

      const result = await response.json()

      const simulationMeta = {
        personaName: persona.name,
        scenarioName: selectedScenario.name,
      }

      sessionStorage.setItem('simulationResult', JSON.stringify(result))
      sessionStorage.setItem('simulationMeta', JSON.stringify(simulationMeta))

      const newSimulation: SimulationHistoryItem = {
        id: Date.now().toString(),
        personaName: persona.name,
        scenarioName: selectedScenario.name,
        result,
        timestamp: new Date().toISOString(),
      }

      const storedHistory = sessionStorage.getItem('simulationHistory')
      const history: SimulationHistoryItem[] = storedHistory ? JSON.parse(storedHistory) : []
      const updatedHistory = [newSimulation, ...history].slice(0, 5)

      sessionStorage.setItem('simulationHistory', JSON.stringify(updatedHistory))
      setSimulationHistory(updatedHistory)

      router.push('/results')
    } catch (error) {
      console.error('Simulation error:', error)
      setError(
        error instanceof Error ? error.message : 'Unable to run simulation. Please try again.'
      )
    } finally {
      setIsSimulating(false)
    }
  }

  const handleOpenSimulation = (simulation: SimulationHistoryItem) => {
    sessionStorage.setItem('simulationResult', JSON.stringify(simulation.result))
    sessionStorage.setItem(
      'simulationMeta',
      JSON.stringify({
        personaName: simulation.personaName,
        scenarioName: simulation.scenarioName,
      })
    )
    router.push('/results')
  }

  return (
    <div className="space-y-10 pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column - Persona */}
        <div className="lg:col-span-1 min-w-0 space-y-4">
          {/* Persona Picker Card */}
          <div className="card-glass p-5">
            <div className="mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Select Persona
              </label>
            </div>

            <div className="relative">
              <select
                value={persona.id || 'default'}
                onChange={(e) => {
                  if (e.target.value === 'default') {
                    setPersona(DEFAULT_PERSONA)
                  } else {
                    const selected = userPersonas.find((p) => p.id === e.target.value)
                    if (selected) setPersona(selected)
                  }
                }}
                className="w-full appearance-none px-3.5 py-3 pr-10 rounded-lg border border-border bg-background text-sm font-medium cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/30 transition-colors"
              >
                {userPersonas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${(p.income / 1000).toFixed(0)}K/yr
                  </option>
                ))}
                <option value="default">Default: John Doe (Standard)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <PersonaConfigCard persona={persona} onEdit={() => setIsEditingPersona(true)} />
        </div>

        {/* Center Column - Main Content */}
        <div className="lg:col-span-1 min-w-0 space-y-8">
          <div className="card-glass p-8">
            <h3 className="text-base font-semibold mb-5">Scenario Selection</h3>

            <div className="relative">
              <select
                value={selectedScenario.id}
                onChange={(e) => {
                  const next = PREDEFINED_SCENARIOS.find((s) => s.id === e.target.value)
                  if (next) {
                    setSelectedScenario(next)
                  }
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

            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {selectedScenario.description}
            </p>

            <Button
              className="w-full mt-5 gap-2"
              onClick={handleRunSimulation}
              disabled={isSimulating}
            >
              <Play className="w-4 h-4" />
              {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
            </Button>

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          </div>

          <div className="card-glass p-8">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Quick Actions
            </h3>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/persona-builder')}
              >
                Create New Persona
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/economic-scenarios')}
              >
                Custom Scenario
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/reports')}
              >
                View Recent Reports
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Macro Environment */}
        <div className="lg:col-span-1 min-w-0">
          <MacroeconomicCard macro={selectedScenario.macro} readOnly />
        </div>
      </div>

      {/* Recent Simulations */}
      {simulationHistory.length > 0 && (
        <div className="card-glass p-8">
          <h3 className="text-base font-semibold mb-5">Recent Simulations</h3>

          <div className="space-y-3">
            {simulationHistory.map((simulation) => (
              <button
                key={simulation.id}
                onClick={() => handleOpenSimulation(simulation)}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium">{simulation.personaName}</p>
                <p className="text-xs text-muted-foreground mt-1">{simulation.scenarioName}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(simulation.timestamp).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Personas Created', value: personaCount, suffix: '' },
          { label: 'Simulations Run', value: simulationCount, suffix: '' },
          { label: 'Avg. Accuracy', value: 87, suffix: '%' },
          { label: 'Reports Generated', value: simulationCount, suffix: '' },
        ].map((stat, i) => (
          <div key={i} className="card-glass p-7 text-center">
            <p className="text-2xl font-mono font-semibold text-primary">
              <CountUpNumber target={stat.value} format={(n) => `${Math.round(n)}${stat.suffix}`} />
            </p>
            <p className="text-xs text-muted-foreground mt-2.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <EditPersonaModal
        persona={isEditingPersona ? persona : null}
        onClose={() => setIsEditingPersona(false)}
        onSave={setPersona}
      />
    </div>
  )
}