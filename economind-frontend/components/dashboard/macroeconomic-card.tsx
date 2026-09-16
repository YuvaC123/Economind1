'use client'

import { MacroeconomicEnvironment, ECONOMIC_INDICATORS } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

interface MacroeconomicCardProps {
  macro: MacroeconomicEnvironment
  onChange?: (key: keyof MacroeconomicEnvironment, value: number) => void
  readOnly?: boolean
}

export function MacroeconomicCard({ macro, onChange, readOnly = false }: MacroeconomicCardProps) {
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
                <div key={indicator.key} className="flex items-center justify-between gap-4 py-3.5 min-w-0">
                  <p className="text-sm text-muted-foreground min-w-0 flex-1">{indicator.label}</p>
                  <p className="text-sm font-mono font-semibold flex-shrink-0">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </p>
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
                    <label className="text-sm font-medium">{indicator.label}</label>
                    <span className="text-sm font-mono font-semibold">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                  </div>

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
