'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronsLeftRight } from 'lucide-react'

const LEFT_NAME = 'Recession Conditions'
const RIGHT_NAME = 'AI Revolution Boom'

const LEFT = { inflation: 2.1, unemployment: 8.5, confidence: 1 }
const RIGHT = { inflation: 3.2, unemployment: 3.1, confidence: 100 }

// Recession red -> boom green, blended by how far the drag has moved.
const LOW_RGB: [number, number, number] = [220, 38, 38]
const HIGH_RGB: [number, number, number] = [22, 163, 74]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function blendColor(t: number) {
  const [r, g, b] = LOW_RGB.map((c, i) => Math.round(lerp(c, HIGH_RGB[i], t)))
  return `rgb(${r}, ${g}, ${b})`
}

export function ScenarioCompare() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [percent, setPercent] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPercent(Math.min(100, Math.max(0, pct)))
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: PointerEvent) => updateFromClientX(e.clientX)
    const handleEnd = () => setIsDragging(false)

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
    }
  }, [isDragging, updateFromClientX])

  // t=0 -> fully "AI Revolution Boom" (drag at the far right), t=1 -> fully
  // "Recession Conditions" (drag at the far left). Every stat is a genuine
  // linear interpolation, so every value in between is reachable - not just
  // the two endpoints.
  const t = 1 - percent / 100

  const inflation = useMemo(() => lerp(RIGHT.inflation, LEFT.inflation, t), [t])
  const unemployment = useMemo(() => lerp(RIGHT.unemployment, LEFT.unemployment, t), [t])
  const confidence = useMemo(() => lerp(RIGHT.confidence, LEFT.confidence, t), [t])
  const confidenceColor = useMemo(() => blendColor(1 - t), [t])

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none touch-none"
      onPointerDown={(e) => {
        setIsDragging(true)
        updateFromClientX(e.clientX)
      }}
    >
      {/* Card surface - clipped to rounded corners. The drag handle lives
          outside this element so it never gets cut off by the clip when it's
          near the left or right edge. */}
      <div className="relative rounded-2xl border border-border overflow-hidden bg-card">
        {/* Background wash - purely decorative, shows which "territory" you're in */}
        <div
          className="absolute inset-0 bg-muted pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
        />

        {/* Divider line - stays crisp within the rounded card */}
        <div
          className="absolute top-0 bottom-0 w-px bg-primary pointer-events-none"
          style={{ left: `${percent}%` }}
        />

        <div className="relative px-6 sm:px-12 pt-6 sm:pt-8 pb-10 sm:pb-14">
          <div className="flex items-center justify-between mb-10 sm:mb-14">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{LEFT_NAME}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{RIGHT_NAME}</p>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Inflation</p>
              <p className="text-2xl sm:text-3xl font-mono font-semibold">{inflation.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Unemployment</p>
              <p className="text-2xl sm:text-3xl font-mono font-semibold">{unemployment.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <p className="text-2xl sm:text-3xl font-mono font-semibold" style={{ color: confidenceColor }}>
                {Math.round(confidence)}
              </p>
            </div>
          </div>

          {/* Where this sits on the full 1-100 confidence index. */}
          <div className="mt-8 sm:mt-10 max-w-xs mx-auto">
            <div className="relative h-1.5 rounded-full bg-border">
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow"
                style={{ left: `${confidence}%`, backgroundColor: confidenceColor }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-mono text-muted-foreground">0</span>
              <span className="text-[10px] text-muted-foreground">confidence index</span>
              <span className="text-[10px] font-mono text-muted-foreground">100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider handle - rendered outside the clipped card so the circle
          stays whole even when dragged all the way to either edge */}
      <motion.div
        onPointerDown={(e) => {
          e.stopPropagation()
          setIsDragging(true)
        }}
        animate={{ scale: isDragging ? 1.15 : 1 }}
        whileHover={{ scale: 1.08 }}
        className="absolute top-4 sm:top-5 -translate-x-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md cursor-ew-resize z-10"
        style={{ left: `${percent}%` }}
      >
        <ChevronsLeftRight className="w-4 h-4" />
      </motion.div>
    </div>
  )
}
