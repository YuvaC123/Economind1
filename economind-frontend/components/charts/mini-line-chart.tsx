'use client'

interface LineDatum {
  label: string
  value: number
}

interface MiniLineChartProps {
  data: LineDatum[]
  formatValue?: (value: number) => string
}

export function MiniLineChart({ data, formatValue }: MiniLineChartProps) {
  const width = 300
  const height = 120
  const padding = 10
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0

  const coords = data.map((d, i) => {
    const x = padding + i * stepX
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2)
    return { x, y, ...d }
  })

  const pathD = `M ${coords.map((c) => `${c.x},${c.y}`).join(' L ')}`
  const areaD = `${pathD} L ${coords[coords.length - 1].x},${height - padding} L ${coords[0].x},${height - padding} Z`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <path d={areaD} className="fill-primary" fillOpacity={0.08} stroke="none" />
        <path
          d={pathD}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r={2.5} className="fill-primary" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-0.5">
        {data.map((d) => (
          <span key={d.label} className="text-[10px] text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
      {formatValue && (
        <p className="text-xs text-muted-foreground mt-2">
          Latest: <span className="font-medium text-foreground">{formatValue(values[values.length - 1])}</span>
        </p>
      )}
    </div>
  )
}
