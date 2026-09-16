'use client'

interface BarDatum {
  label: string
  value: number
}

interface MiniBarChartProps {
  data: BarDatum[]
  formatValue?: (value: number) => string
  height?: number
}

export function MiniBarChart({ data, formatValue, height = 140 }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="w-full flex items-end justify-between gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <span className="text-xs font-medium">{formatValue ? formatValue(d.value) : d.value}</span>
          <div className="w-full rounded-md bg-muted relative overflow-hidden" style={{ height }}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary rounded-md transition-all duration-700 ease-out"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground text-center leading-tight truncate w-full">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}
