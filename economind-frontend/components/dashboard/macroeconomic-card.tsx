'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MacroeconomicEnvironment, ECONOMIC_INDICATORS } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { InfoIconButton } from '@/components/shared/info-icon-button'

interface MacroeconomicCardProps {
  macro: MacroeconomicEnvironment
  onChange?: (key: keyof MacroeconomicEnvironment, value: number) => void
  readOnly?: boolean
}

const INDICATOR_DEFINITIONS: Record<string, string> = {
  inflation: 'How fast prices rise year over year. Higher inflation erodes purchasing power, pushing personas to spend sooner and save less.',
  interestRate: "The cost of borrowing (and the return on savings). Higher rates discourage debt and reward saving; lower rates encourage borrowing and spending.",
  gdpGrowth: 'The rate the overall economy is expanding or shrinking. Negative growth signals a recession, which tends to make personas more cautious.',
  unemployment: 'Share of the workforce without a job. Higher unemployment increases income uncertainty and typically raises precautionary saving.',
  wageGrowth: 'How fast take-home pay is rising. When wage growth lags inflation, real purchasing power falls even if nominal income goes up.',
  housingPrices: 'An index of home prices (100 = baseline). Rising prices boost homeowner wealth but strain affordability for buyers and renters.',
  energyPrices: 'An index of energy costs (100 = baseline). Spikes act like a tax on every household, squeezing the budget left for discretionary spending.',
  aiAdoption: 'How widely AI tools are being adopted across the economy. Higher adoption in this simulation shifts productivity and job-market expectations.',
  marketConfidence: 'A 0–100 index of investor and consumer optimism. Low confidence tends to increase saving and reduce investing, and vice versa.',
}

export function MacroeconomicCard({ macro, onChange, readOnly = false }: MacroeconomicCardProps) {
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({})
  const toggleHint = (key: string) => setOpenHints((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <Card className="[--card-spacing:--spacing(7)] min-w-0">
      <CardHeader>
        <CardTitle>Macroeconomic Environment</CardTitle>
        <CardDescription className="mt-1">Current economic indicators and market conditions</CardDescription>
      </CardHeader>

      <CardContent>
        {readOnly ? (
          // Compact read-only list - one row per indicator, full card width so
          // labels never compete with a neighboring column for space.
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto pr-1 -mr-1">
            {ECONOMIC_INDICATORS.map((indicator) => {
              const value = macro[indicator.key as keyof MacroeconomicEnvironment]
              return (
                <div key={indicator.key} className="py-3.5 min-w-0">
                  <div className="flex items-center justify-between gap-4 min-w-0">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 flex-1">
                      <span className="truncate">{indicator.label}</span>
                      <InfoIconButton
                        open={!!openHints[indicator.key]}
                        onToggle={() => toggleHint(indicator.key)}
                        label={indicator.label}
                      />
                    </span>
                    <p className="text-sm font-mono font-semibold flex-shrink-0">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </p>
                  </div>
                  <AnimatePresence initial={false}>
                    {openHints[indicator.key] && (
                      <motion.p
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 6 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                      >
                        {INDICATOR_DEFINITIONS[indicator.key]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {ECONOMIC_INDICATORS.map((indicator) => {
              const value = macro[indicator.key as keyof MacroeconomicEnvironment]

              return (
                <div key={indicator.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {indicator.label}
                      <InfoIconButton
                        open={!!openHints[indicator.key]}
                        onToggle={() => toggleHint(indicator.key)}
                        label={indicator.label}
                      />
                    </span>
                    <span className="text-sm font-mono font-semibold">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {openHints[indicator.key] && (
                      <motion.p
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 0 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
                      >
                        {INDICATOR_DEFINITIONS[indicator.key]}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Slider
                    value={[typeof value === 'number' ? value : 0]}
                    onValueChange={(val: number | readonly number[]) =>
                      onChange?.(
                        indicator.key as keyof MacroeconomicEnvironment,
                        Array.isArray(val) ? val[0] : (val as number)
                      )
                    }
                    min={indicator.min}
                    max={indicator.max}
                    step={indicator.step}
                  />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
