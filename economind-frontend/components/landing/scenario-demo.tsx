'use client'

import { useMemo, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { AnimatedNumber } from '@/components/shared/animated-number'

const MONTHLY_INCOME = 5200

export function ScenarioDemo() {
  const [inflation, setInflation] = useState([3.5])

  const rate = inflation[0]

  const { spending, saving, investing, mood } = useMemo(() => {
    // Simple illustrative behavioral model: as inflation rises, this persona
    // spends a larger share on essentials and pulls back on saving/investing.
    const spendShare = 0.52 + rate * 0.028
    const saveShare = Math.max(0.08, 0.26 - rate * 0.016)
    const investShare = Math.max(0.06, 1 - spendShare - saveShare)

    const spending = MONTHLY_INCOME * spendShare
    const saving = MONTHLY_INCOME * saveShare
    const investing = MONTHLY_INCOME * investShare

    const mood = rate < 3 ? 'Confident' : rate < 6 ? 'Cautious' : 'Defensive'

    return { spending, saving, investing, mood }
  }, [rate])

  const rows = [
    { label: 'Spending', value: spending },
    { label: 'Saving', value: saving },
    { label: 'Investing', value: investing },
  ]
  const max = MONTHLY_INCOME

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">John Doe, age 35</p>
        <span className="text-xs font-mono text-muted-foreground">${MONTHLY_INCOME.toLocaleString()}/mo</span>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Moderate risk appetite &middot; diversified investor</p>

      <div className="mb-7">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Inflation</label>
          <span className="text-sm font-mono font-semibold text-primary">
            <AnimatedNumber value={rate} format={(n) => `${n.toFixed(1)}%`} />
          </span>
        </div>
        <Slider
          value={inflation}
          onValueChange={(v) => setInflation(Array.isArray(v) ? [v[0]] : [v as number])}
          min={0}
          max={10}
          step={0.1}
        />
        <p className="text-xs text-muted-foreground mt-2">Drag to see how their monthly decisions shift</p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-mono font-medium">
                <AnimatedNumber value={row.value} format={(n) => `$${Math.round(n).toLocaleString()}`} />
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Behavioral read</span>
        <span className="text-sm font-medium">{mood}</span>
      </div>
    </div>
  )
}
