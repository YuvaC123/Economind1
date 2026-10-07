'use client'

interface PhillipsCurveChartProps {
  unemploymentRate: number
  actualInflation: number
  expectedInflation: number
  // Shape of the theoretical curve drawn behind the data — must match the
  // backend's constants (economind-backend/index.ts) so the line shown here
  // is the same one this scenario's alignment score was computed against.
  naturalUnemploymentRate?: number
  baselineInflation?: number
  sensitivity?: number
}

// Plots one scenario's (unemployment, inflation) point against the
// theoretical short-run Phillips Curve, plus where the curve itself predicts
// inflation should sit for that unemployment rate — so the gap between the
// two points is visible at a glance, not just stated as a number.
export function PhillipsCurveChart({
  unemploymentRate,
  actualInflation,
  expectedInflation,
  naturalUnemploymentRate = 4.5,
  baselineInflation = 2.0,
  sensitivity = 0.5,
}: PhillipsCurveChartProps) {
  const width = 320
  const height = 170
  const padding = 30

  // Fixed axis ranges so the curve's shape reads consistently across
  // different simulations rather than rescaling (and looking different) run
  // to run.
  const uMin = 0
  const uMax = 12
  const infMin = -2
  const infMax = 12

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const xFor = (u: number) => padding + ((u - uMin) / (uMax - uMin)) * (width - padding * 2)
  const yFor = (inf: number) =>
    height - padding - ((clamp(inf, infMin, infMax) - infMin) / (infMax - infMin)) * (height - padding * 2)

  const curvePoints = Array.from({ length: 25 }, (_, i) => {
    const u = uMin + (i / 24) * (uMax - uMin)
    const inf = baselineInflation - sensitivity * (u - naturalUnemploymentRate)
    return { x: xFor(u), y: yFor(inf) }
  })
  const curveD = `M ${curvePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`

  const actualX = xFor(unemploymentRate)
  const actualY = yFor(actualInflation)
  const expectedY = yFor(expectedInflation)
  const gapVisible = Math.abs(actualY - expectedY) > 2

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {/* zero-inflation reference line */}
        <line
          x1={padding}
          y1={yFor(0)}
          x2={width - padding}
          y2={yFor(0)}
          stroke="currentColor"
          className="text-border"
          strokeWidth={1}
        />
        {/* theoretical curve */}
        <path d={curveD} fill="none" stroke="currentColor" className="text-muted-foreground/50" strokeWidth={1.5} strokeDasharray="4 3" />
        {/* the gap between curve-predicted and actual inflation */}
        {gapVisible && (
          <line
            x1={actualX}
            y1={expectedY}
            x2={actualX}
            y2={actualY}
            stroke="currentColor"
            className="text-amber-400"
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
        )}
        {/* curve-predicted point */}
        <circle cx={actualX} cy={expectedY} r={3.5} fill="currentColor" className="text-muted-foreground" />
        {/* this scenario's actual point */}
        <circle cx={actualX} cy={actualY} r={5} className="fill-primary" />

        <text x={padding} y={height - 8} fontSize={9} fill="currentColor" className="text-muted-foreground">
          {uMin}%
        </text>
        <text x={width - padding} y={height - 8} fontSize={9} textAnchor="end" fill="currentColor" className="text-muted-foreground">
          {uMax}% unemployment
        </text>
        <text x={padding} y={12} fontSize={9} fill="currentColor" className="text-muted-foreground">
          {infMax}%
        </text>
        <text x={padding} y={yFor(0) - 4} fontSize={9} fill="currentColor" className="text-muted-foreground">
          0% inflation
        </text>
      </svg>
      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary inline-block flex-shrink-0" />
          This scenario — {unemploymentRate}% unemployment, {actualInflation}% inflation
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block flex-shrink-0" />
          Curve predicts {expectedInflation}% inflation
        </span>
      </div>
    </div>
  )
}
