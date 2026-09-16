'use client'

interface DonutDatum {
  label: string
  value: number
}

interface MiniDonutChartProps {
  data: DonutDatum[]
}

const OPACITIES = [1, 0.65, 0.4, 0.22, 0.12]

export function MiniDonutChart({ data }: MiniDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const size = 112
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-muted" strokeWidth={14} />
          {data.map((d, i) => {
            const fraction = total > 0 ? d.value / total : 0
            const dash = fraction * circumference
            const segment = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-primary transition-all duration-700 ease-out"
                strokeOpacity={OPACITIES[i % OPACITIES.length]}
                strokeWidth={14}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return segment
          })}
        </g>
      </svg>
      <div className="space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 bg-primary"
              style={{ opacity: OPACITIES[i % OPACITIES.length] }}
            />
            <span className="text-muted-foreground truncate">{d.label}</span>
            <span className="font-medium ml-auto flex-shrink-0">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
