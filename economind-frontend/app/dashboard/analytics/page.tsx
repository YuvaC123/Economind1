'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, LineChart, PieChart, Loader2, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { MiniBarChart } from '@/components/charts/mini-bar-chart'
import { MiniLineChart } from '@/components/charts/mini-line-chart'
import { MiniDonutChart } from '@/components/charts/mini-donut-chart'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

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

export default function AnalyticsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [simulations, setSimulations] = useState<SimulationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    async function loadData() {
      try {
        const res = await fetch(`${API_URL}/simulations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.msg ?? 'Failed to load analytics data')
        setSimulations(data.simulations ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [token])

  // Computed metrics from real simulation runs
  const analytics = useMemo(() => {
    if (!simulations.length) return null

    // 1. Averages
    const totalSpending = simulations.reduce((acc, s) => acc + (s.decisions?.spending || 0), 0)
    const totalSaving = simulations.reduce((acc, s) => acc + (s.decisions?.saving || 0), 0)
    const totalInvesting = simulations.reduce((acc, s) => acc + (s.decisions?.investing || 0), 0)
    const totalBorrowing = simulations.reduce((acc, s) => acc + (s.decisions?.borrowing || 0), 0)
    const totalDecisionsSum = totalSpending + totalSaving + totalInvesting + totalBorrowing || 1

    const avgSpending = Math.round(totalSpending / simulations.length)
    const avgSaving = Math.round(totalSaving / simulations.length)
    const savingsRate = Math.round((totalSaving / totalDecisionsSum) * 100)
    const investRate = Math.round((totalInvesting / totalDecisionsSum) * 100)

    // Average Risk Tolerance
    const avgRisk = Math.round(
      simulations.reduce((acc, s) => acc + (s.behavioral_traits?.riskTolerance || 50), 0) /
        simulations.length
    )

    // 2. Spending Distribution (Percentage Breakdown)
    const spendingDistribution = [
      { label: 'Spending', value: Math.round((totalSpending / totalDecisionsSum) * 100) },
      { label: 'Savings', value: savingsRate },
      { label: 'Investing', value: investRate },
      { label: 'Borrowing', value: Math.round((totalBorrowing / totalDecisionsSum) * 100) },
    ]

    // 3. Confidence Scores
    const confSpending = Math.round(
      (simulations.reduce((acc, s) => acc + (s.confidence?.spending || 0.8), 0) /
        simulations.length) *
        100
    )
    const confSaving = Math.round(
      (simulations.reduce((acc, s) => acc + (s.confidence?.saving || 0.8), 0) /
        simulations.length) *
        100
    )
    const confBorrowing = Math.round(
      (simulations.reduce((acc, s) => acc + (s.confidence?.borrowing || 0.6), 0) /
        simulations.length) *
        100
    )
    const confInvesting = Math.round(
      (simulations.reduce((acc, s) => acc + (s.confidence?.investing || 0.7), 0) /
        simulations.length) *
        100
    )

    const confidenceScores = [
      { label: 'Spending', value: confSpending },
      { label: 'Saving', value: confSaving },
      { label: 'Borrowing', value: confBorrowing },
      { label: 'Investing', value: confInvesting },
    ]

    // 4. Consumer / Persona Comparison (Recent runs)
    const consumerComparison = simulations.slice(0, 5).map((s) => ({
      label: s.persona_name,
      value: s.decisions?.spending || 0,
    }))

    // 5. Behavioral Traits (Investment & Decision Breakdown)
    const avgFuture = Math.round(
      simulations.reduce((acc, s) => acc + (s.behavioral_traits?.futureOrientation || 50), 0) /
        simulations.length
    )
    const avgImpulsive = Math.round(
      simulations.reduce((acc, s) => acc + (s.behavioral_traits?.impulsivity || 20), 0) /
        simulations.length
    )
    const avgSocial = Math.round(
      simulations.reduce((acc, s) => acc + (s.behavioral_traits?.socialConformity || 30), 0) /
        simulations.length
    )

    const traitAllocation = [
      { label: 'Risk Appetite', value: avgRisk },
      { label: 'Future Focus', value: avgFuture },
      { label: 'Impulsivity', value: avgImpulsive },
      { label: 'Social Norms', value: avgSocial },
    ]

    // 6. Savings Trend Over Recent Runs
    const savingsTrend = [...simulations]
      .reverse()
      .slice(-6)
      .map((s, idx) => ({
        label: `Run #${idx + 1}`,
        value: s.decisions?.saving || 0,
      }))

    // 7. Timeline Indicator
    const timelineData = [...simulations]
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
      spendingDistribution,
      confidenceScores,
      consumerComparison,
      traitAllocation,
      savingsTrend,
      timelineData,
    }
  }, [simulations])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-medium mb-1">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Live aggregated insights across all your economic behavior simulation runs
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading simulation analytics…
        </div>
      ) : !analytics || simulations.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <Sparkles className="w-10 h-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">No Simulation Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Run economic simulations from the dashboard to generate real-time behavioral analytics,
            comparative metrics, and confidence distributions.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="gap-2">
            Run Your First Simulation
          </Button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BarChart3}
              label="Monthly Spending"
              value={`$${analytics.avgSpending.toLocaleString()}`}
              change={`${simulations.length} runs`}
              changePositive
            />
            <StatCard
              icon={LineChart}
              label="Savings Ratio"
              value={`${analytics.savingsRate}%`}
              change={`$${analytics.avgSaving.toLocaleString()}/mo`}
              changePositive
            />
            <StatCard
              icon={PieChart}
              label="Investment Share"
              value={`${analytics.investRate}%`}
              change="Portfolio"
              changePositive
            />
            <StatCard
              icon={BarChart3}
              label="Risk Index"
              value={`${(analytics.avgRisk / 10).toFixed(1)}/10`}
              change="Aggregated"
              changePositive
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-glass">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Capital Allocation Breakdown</h3>
              </div>
              <MiniDonutChart data={analytics.spendingDistribution} />
            </div>

            <div className="card-glass">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Savings Trajectory (Recent Runs)</h3>
              </div>
              <MiniLineChart
                data={analytics.savingsTrend}
                formatValue={(v) => `$${v.toLocaleString()}`}
              />
            </div>

            <div className="card-glass">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Behavioral Trait Index</h3>
              </div>
              <MiniDonutChart data={analytics.traitAllocation} />
            </div>

            <div className="card-glass">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Monthly Spending by Persona</h3>
              </div>
              <MiniBarChart
                data={analytics.consumerComparison}
                formatValue={(v) => `$${v.toLocaleString()}`}
              />
            </div>

            <div className="card-glass">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Spending by Simulation Run</h3>
              </div>
              <MiniLineChart
                data={analytics.timelineData}
                formatValue={(v) => `$${v.toLocaleString()}`}
              />
            </div>

            <div className="card-glass">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-medium">LLM Decision Confidence Scores</h3>
              </div>
              <MiniBarChart
                data={analytics.confidenceScores}
                formatValue={(v) => `${v}%`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

