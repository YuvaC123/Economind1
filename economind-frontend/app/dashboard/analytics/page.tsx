'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  LineChart,
  PieChart,
  Loader2,
  Sparkles,
  Users,
  ChevronDown,
  Briefcase,
  Home,
  TrendingUp,
  CreditCard,
  Receipt,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { MiniBarChart } from '@/components/charts/mini-bar-chart'
import { MiniLineChart } from '@/components/charts/mini-line-chart'
import { MiniDonutChart } from '@/components/charts/mini-donut-chart'
import { InfoIconButton } from '@/components/shared/info-icon-button'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { Persona } from '@/lib/mock-data'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const ALL_PERSONAS = 'all'

interface SimulationRecord {
  id: string
  persona_name: string
  scenario_name: string
  summary: string
  decisions: {
    spending?: number
    saving?: number
    borrowing?: number
    investing?: number
  }
  confidence: {
    spending?: number
    saving?: number
    borrowing?: number
    investing?: number
  }
  behavioral_traits: {
    riskTolerance?: number
    futureOrientation?: number
    impulsivity?: number
    socialConformity?: number
  }
  theory_alignment: {
    rationalChoice?: number
    behavioralEconomics?: number
    keynesianEconomics?: number
    austrianEconomics?: number
  }
  reasoning: string[]
  createdAt: string
}

// Mirrors the mapping in app/dashboard/page.tsx — each page that lists
// personas keeps its own small copy rather than sharing a fetch hook.
interface ApiPersona {
  id: string
  name: string
  age: number
  gender?: string | null
  education?: string | null
  income: number
  income_min: number | null
  income_max: number | null
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
    incomeMin: p.income_min ?? p.income,
    incomeMax: p.income_max ?? p.income,
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

// Population standard deviation — used to judge how consistent a persona's
// decisions are from one simulation run to the next.
function stdev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

// A compact, single-row persona summary so the stat/chart grid below keeps
// its full width instead of being squeezed into a narrow sidebar column.
function PersonaStrip({ persona }: { persona: Persona }) {
  const chips = [
    { icon: Users, label: 'Age', value: `${persona.age}` },
    {
      icon: Briefcase,
      label: 'Income',
      value: `$${(persona.incomeMin / 1000).toFixed(0)}K–$${(persona.incomeMax / 1000).toFixed(0)}K`,
    },
    { icon: Home, label: 'Wealth', value: `$${(persona.wealth / 1000).toFixed(0)}K` },
    { icon: TrendingUp, label: 'Savings', value: `$${(persona.savings / 1000).toFixed(0)}K` },
    { icon: CreditCard, label: 'Debt', value: `$${(persona.debt / 1000).toFixed(0)}K` },
    { icon: Receipt, label: 'Expenses', value: `$${(persona.monthlyExpenses / 1000).toFixed(1)}K/mo` },
    { icon: ShieldCheck, label: 'Risk', value: persona.riskAppetite },
  ]

  return (
    <div className="card-glass flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
      <div className="flex items-center gap-2.5 pr-6 border-r border-border">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
          {persona.name.charAt(0)}
        </div>
        <span className="font-medium truncate max-w-[14ch]">{persona.name}</span>
      </div>
      {chips.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <c.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{c.label}</span>
          <span className="text-sm font-mono font-semibold capitalize">{c.value}</span>
        </div>
      ))}
    </div>
  )
}

// Every chart card gets the same shape: icon + title + a click-to-reveal
// plain-language explanation, so a chart someone doesn't immediately
// recognize (a donut, a trend line) still tells them what it's showing
// and why it's useful, not just what it's called.
function ChartCard({
  icon: Icon,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  icon: LucideIcon
  title: string
  hint: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card-glass">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <h3 className="font-medium truncate">{title}</h3>
        </div>
        <InfoIconButton open={open} onToggle={onToggle} label={title} />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [simulations, setSimulations] = useState<SimulationRecord[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(ALL_PERSONAS)
  const hasAutoSelected = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({})
  const toggleHint = (key: string) => setOpenHints((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    if (!token) return

    async function loadData() {
      try {
        const [simRes, personaRes] = await Promise.all([
          fetch(`${API_URL}/simulations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/personas`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const simData = await simRes.json()
        const personaData = await personaRes.json()
        if (!simRes.ok) throw new Error(simData.msg ?? 'Failed to load analytics data')
        setSimulations(simData.simulations ?? [])
        if (Array.isArray(personaData.personas)) {
          setPersonas(personaData.personas.map(fromApiPersona))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [token])

  // Default to the first real persona once personas load, rather than
  // leaving the page in the less-useful "everything blended together" view.
  useEffect(() => {
    if (!hasAutoSelected.current && personas.length > 0) {
      setSelectedPersonaId(personas[0].id)
      hasAutoSelected.current = true
    }
  }, [personas])

  const isAllMode = selectedPersonaId === ALL_PERSONAS
  const selectedPersona = isAllMode ? null : personas.find((p) => p.id === selectedPersonaId) ?? null

  // A synthetic "persona" blending every real one, so the "All personas"
  // view can reuse the exact same strip/stat-card/chart layout as a single
  // persona instead of swapping to a different UI — only the numbers differ.
  const aggregatePersona: Persona | null = useMemo(() => {
    if (personas.length === 0) return null
    const n = personas.length
    const avg = (f: (p: Persona) => number) => Math.round(personas.reduce((a, p) => a + f(p), 0) / n)
    const riskCounts: Record<string, number> = {}
    personas.forEach((p) => {
      riskCounts[p.riskAppetite] = (riskCounts[p.riskAppetite] || 0) + 1
    })
    const riskAppetite = (Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      'moderate') as Persona['riskAppetite']

    return {
      id: ALL_PERSONAS,
      name: `All ${n} Persona${n === 1 ? '' : 's'}`,
      age: avg((p) => p.age),
      gender: 'other',
      education: 'bachelors',
      incomeMin: avg((p) => p.incomeMin),
      incomeMax: avg((p) => p.incomeMax),
      wealth: avg((p) => p.wealth),
      savings: avg((p) => p.savings),
      debt: avg((p) => p.debt),
      monthlyExpenses: avg((p) => p.monthlyExpenses),
      riskAppetite,
      spendingBehavior: 'balanced',
      savingPreference: 'retirement',
      investmentPreference: 'diversified',
    }
  }, [personas])

  // Whichever persona (real or blended) the page is currently showing — the
  // UI below always renders the same way regardless of which one this is.
  const effectivePersona = selectedPersona ?? aggregatePersona

  // Simulations don't store a persona_id (only a point-in-time name snapshot),
  // so matching by name is the closest link available. A persona renamed
  // after a run won't match its own old history — an acceptable gap here.
  const scopedSimulations = useMemo(() => {
    if (isAllMode || !selectedPersona) return simulations
    return simulations.filter((s) => s.persona_name === selectedPersona.name)
  }, [simulations, isAllMode, selectedPersona])

  // Computed metrics from real simulation runs
  const analytics = useMemo(() => {
    const data = scopedSimulations
    if (!data.length) return null

    // 1. Averages
    const totalSpending = data.reduce((acc, s) => acc + (s.decisions?.spending || 0), 0)
    const totalSaving = data.reduce((acc, s) => acc + (s.decisions?.saving || 0), 0)
    const totalInvesting = data.reduce((acc, s) => acc + (s.decisions?.investing || 0), 0)
    const totalBorrowing = data.reduce((acc, s) => acc + (s.decisions?.borrowing || 0), 0)
    const totalDecisionsSum = totalSpending + totalSaving + totalInvesting + totalBorrowing || 1

    const avgSpending = Math.round(totalSpending / data.length)
    const avgSaving = Math.round(totalSaving / data.length)
    const savingsRate = Math.round((totalSaving / totalDecisionsSum) * 100)
    const investRate = Math.round((totalInvesting / totalDecisionsSum) * 100)

    // Average Risk Tolerance
    const avgRisk = Math.round(
      data.reduce((acc, s) => acc + (s.behavioral_traits?.riskTolerance || 50), 0) / data.length
    )

    // Financial-health metrics, relative to whichever persona (real or
    // blended) is currently in focus.
    let savingsRateOfIncome: number | null = null
    let debtToIncomePct: number | null = null
    if (effectivePersona) {
      const annualIncomeMid = (effectivePersona.incomeMin + effectivePersona.incomeMax) / 2
      const grossMonthlyIncome = annualIncomeMid / 12
      if (grossMonthlyIncome > 0) {
        savingsRateOfIncome = Math.round((avgSaving / grossMonthlyIncome) * 100)
      }
      if (annualIncomeMid > 0) {
        debtToIncomePct = Math.round((effectivePersona.debt / annualIncomeMid) * 100)
      }
    }

    // Decision Consistency — how much spending varies run to run. A low
    // coefficient of variation means the persona behaves predictably across
    // different economic scenarios; a high one means it's very scenario-sensitive.
    const spendingValues = data.map((s) => s.decisions?.spending || 0)
    const spendingMean = spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length
    const consistency =
      data.length > 1 && spendingMean > 0
        ? Math.max(0, Math.min(100, Math.round(100 - (stdev(spendingValues) / spendingMean) * 100)))
        : null

    // 2. Spending Distribution (Percentage Breakdown)
    const spendingDistribution = [
      { label: 'Spending', value: Math.round((totalSpending / totalDecisionsSum) * 100) },
      { label: 'Savings', value: savingsRate },
      { label: 'Investing', value: investRate },
      { label: 'Borrowing', value: Math.round((totalBorrowing / totalDecisionsSum) * 100) },
    ]

    // 3. Confidence Scores
    const confSpending = Math.round(
      (data.reduce((acc, s) => acc + (s.confidence?.spending || 0.8), 0) / data.length) * 100
    )
    const confSaving = Math.round(
      (data.reduce((acc, s) => acc + (s.confidence?.saving || 0.8), 0) / data.length) * 100
    )
    const confBorrowing = Math.round(
      (data.reduce((acc, s) => acc + (s.confidence?.borrowing || 0.6), 0) / data.length) * 100
    )
    const confInvesting = Math.round(
      (data.reduce((acc, s) => acc + (s.confidence?.investing || 0.7), 0) / data.length) * 100
    )

    const confidenceScores = [
      { label: 'Spending', value: confSpending },
      { label: 'Saving', value: confSaving },
      { label: 'Borrowing', value: confBorrowing },
      { label: 'Investing', value: confInvesting },
    ]

    // 4. Savings rate by scenario — how this persona's behavior shifts
    // across the economic conditions it's been tested under.
    const scenarioGroups = new Map<string, SimulationRecord[]>()
    data.forEach((s) => {
      const key = s.scenario_name || 'Unknown'
      scenarioGroups.set(key, [...(scenarioGroups.get(key) ?? []), s])
    })
    const savingsByScenario = Array.from(scenarioGroups.entries()).map(([label, sims]) => {
      const sSpending = sims.reduce((a, s) => a + (s.decisions?.spending || 0), 0)
      const sSaving = sims.reduce((a, s) => a + (s.decisions?.saving || 0), 0)
      const sInvesting = sims.reduce((a, s) => a + (s.decisions?.investing || 0), 0)
      const sBorrowing = sims.reduce((a, s) => a + (s.decisions?.borrowing || 0), 0)
      const sTotal = sSpending + sSaving + sInvesting + sBorrowing || 1
      return { label, value: Math.round((sSaving / sTotal) * 100) }
    })

    // 5. Behavioral Traits (Investment & Decision Breakdown)
    const avgFuture = Math.round(
      data.reduce((acc, s) => acc + (s.behavioral_traits?.futureOrientation || 50), 0) / data.length
    )
    const avgImpulsive = Math.round(
      data.reduce((acc, s) => acc + (s.behavioral_traits?.impulsivity || 20), 0) / data.length
    )
    const avgSocial = Math.round(
      data.reduce((acc, s) => acc + (s.behavioral_traits?.socialConformity || 30), 0) / data.length
    )

    const traitAllocation = [
      { label: 'Risk Appetite', value: avgRisk },
      { label: 'Future Focus', value: avgFuture },
      { label: 'Impulsivity', value: avgImpulsive },
      { label: 'Social Norms', value: avgSocial },
    ]

    // 6. Savings Trend Over Recent Runs
    const savingsTrend = [...data]
      .reverse()
      .slice(-6)
      .map((s, idx) => ({
        label: `Run #${idx + 1}`,
        value: s.decisions?.saving || 0,
      }))

    // 7. Timeline Indicator
    const timelineData = [...data]
      .reverse()
      .slice(-6)
      .map((s, idx) => ({
        label: `Run #${idx + 1}`,
        value: s.decisions?.spending || 0,
      }))

    return {
      avgSpending,
      avgSaving,
      savingsRate,
      investRate,
      avgRisk,
      savingsRateOfIncome,
      debtToIncomePct,
      consistency,
      spendingDistribution,
      confidenceScores,
      savingsByScenario,
      traitAllocation,
      savingsTrend,
      timelineData,
      runCount: data.length,
    }
  }, [scopedSimulations, effectivePersona])

  return (
    <div className="space-y-6">
      <div>
        {/* Title and the persona selector share one row that wraps only for
            genuine viewport-width reasons — the subtitle (whose length varies
            with the persona's name) lives on its own full-width row below so
            it can never be what pushes the selector onto a second line. */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-heading text-3xl font-medium mb-1">Analytics Dashboard</h2>

          {personas.length > 0 && (
            <div className="min-w-[220px] flex-shrink-0">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Focus persona
              </label>
              <div className="relative">
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/30 transition-colors"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value={ALL_PERSONAS}>All personas (combined)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <p className="text-muted-foreground truncate">
          Behavioral insights for {effectivePersona?.name ?? 'your personas'}, drawn from its own simulation
          history
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
          These numbers come from simulations you&apos;ve run, not real financial data — they show patterns
          in how this persona tends to behave under different economic conditions. Click the{' '}
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-[9px] leading-none align-middle mx-0.5">
            i
          </span>{' '}
          next to any card or chart to see what it means.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading simulation analytics…
        </div>
      ) : !analytics || scopedSimulations.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <Sparkles className="w-10 h-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">
            {effectivePersona ? `No Runs Yet for ${effectivePersona.name}` : 'No Simulation Data Yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Run a simulation from the dashboard to generate real-time behavioral analytics, comparative
            metrics, and confidence distributions here.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="gap-2">
            Run A Simulation
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {effectivePersona && <PersonaStrip persona={effectivePersona} />}

          <div className="space-y-6 min-w-0">
            {/* Stats Overview — same four metrics regardless of focus; only the
                numbers behind them change. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={BarChart3}
                label="Spending"
                value={`$${analytics.avgSpending.toLocaleString()}`}
                change={`${analytics.runCount} run${analytics.runCount === 1 ? '' : 's'}`}
                changePositive
                hint="Average monthly spending decision across every simulation run in scope."
              />
              <StatCard
                icon={LineChart}
                label="Savings/Income"
                value={
                  analytics.savingsRateOfIncome === null ? `${analytics.savingsRate}%` : `${analytics.savingsRateOfIncome}%`
                }
                change={`$${analytics.avgSaving.toLocaleString()}/mo of gross pay`}
                changePositive={(analytics.savingsRateOfIncome ?? analytics.savingsRate) >= 15}
                hint="Average monthly saving as a share of gross (pre-tax) monthly income. 15%+ is a commonly cited healthy savings rate."
              />
              <StatCard
                icon={PieChart}
                label="Debt/Income"
                value={analytics.debtToIncomePct === null ? `${analytics.investRate}%` : `${analytics.debtToIncomePct}%`}
                change={
                  analytics.debtToIncomePct === null
                    ? 'Portfolio'
                    : analytics.debtToIncomePct <= 36
                      ? 'Healthy range'
                      : 'Elevated'
                }
                changePositive={analytics.debtToIncomePct === null || analytics.debtToIncomePct <= 36}
                hint="Total debt as a share of annual income. Lenders typically consider 36% or below a healthy debt-to-income ratio."
              />
              <StatCard
                icon={BarChart3}
                label="Consistency"
                value={analytics.consistency === null ? `${(analytics.avgRisk / 10).toFixed(1)}/10` : `${analytics.consistency}%`}
                change={
                  analytics.consistency === null
                    ? 'Risk index'
                    : analytics.consistency >= 70
                      ? 'Predictable'
                      : 'Scenario-sensitive'
                }
                changePositive={analytics.consistency === null || analytics.consistency >= 70}
                hint="How little spending varies run to run (100% = identical every time). A low score means this persona reacts strongly to different economic scenarios."
              />
            </div>

            {/* Charts Grid — every card explains itself via its info icon */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                icon={PieChart}
                title="Where the Money Goes"
                open={!!openHints.allocation}
                onToggle={() => toggleHint('allocation')}
                hint="Every simulated dollar, split four ways: spending, saving, investing, and new borrowing. Shows the persona's overall financial priorities across every run in scope."
              >
                <MiniDonutChart data={analytics.spendingDistribution} />
              </ChartCard>

              <ChartCard
                icon={LineChart}
                title="Savings Over Time"
                open={!!openHints.savingsTrend}
                onToggle={() => toggleHint('savingsTrend')}
                hint="Monthly saving decision across the last several simulation runs, in order. Each 'run' is one simulation — a persona tested against one scenario — so this shows whether saving is trending up or down as conditions change."
              >
                <MiniLineChart
                  data={analytics.savingsTrend}
                  formatValue={(v) => `$${v.toLocaleString()}`}
                />
              </ChartCard>

              <ChartCard
                icon={PieChart}
                title="Psychological Traits"
                open={!!openHints.traits}
                onToggle={() => toggleHint('traits')}
                hint="The AI's read on this persona's decision-making style, 0–100 each: Risk Appetite (comfort with uncertain outcomes), Future Focus (patience for delayed reward over instant gratification), Impulsivity (likelihood of quick, unplanned decisions), and Social Norms (how much peer/market behavior sways their choices)."
              >
                <MiniDonutChart data={analytics.traitAllocation} />
              </ChartCard>

              <ChartCard
                icon={BarChart3}
                title="Savings Rate by Scenario"
                open={!!openHints.byScenario}
                onToggle={() => toggleHint('byScenario')}
                hint="What share of money went to saving under each economic scenario this persona has been tested against — lets you compare how the same persona reacts to, say, a recession versus a boom."
              >
                {analytics.savingsByScenario.length > 1 ? (
                  <MiniBarChart data={analytics.savingsByScenario} formatValue={(v) => `${v}%`} />
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Run a second scenario to compare how savings behavior shifts across economic
                    conditions.
                  </p>
                )}
              </ChartCard>

              <ChartCard
                icon={LineChart}
                title="Spending Over Time"
                open={!!openHints.spendingTrend}
                onToggle={() => toggleHint('spendingTrend')}
                hint="Monthly spending decision across the last several simulation runs, in order — shows whether spending is rising, falling, or holding steady run to run."
              >
                <MiniLineChart
                  data={analytics.timelineData}
                  formatValue={(v) => `$${v.toLocaleString()}`}
                />
              </ChartCard>

              <ChartCard
                icon={BarChart3}
                title="AI Confidence by Decision"
                open={!!openHints.confidence}
                onToggle={() => toggleHint('confidence')}
                hint="How certain the AI model (the 'LLM' powering these simulations) says it is about each type of decision — not a guarantee the decision is correct, just the model's own self-reported confidence."
              >
                <MiniBarChart data={analytics.confidenceScores} formatValue={(v) => `${v}%`} />
              </ChartCard>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
