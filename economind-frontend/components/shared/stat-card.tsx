'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { InfoIconButton } from '@/components/shared/info-icon-button'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: string
  changePositive?: boolean
  // Optional one-line definition, for metrics that aren't self-explanatory
  // (e.g. a custom-computed ratio). Shown behind a click-to-reveal info icon.
  hint?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changePositive,
  hint,
}: StatCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card-glass min-w-0 p-5 flex flex-col">
      <div className="flex items-center justify-between gap-1.5 h-5 mb-3 min-w-0 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground truncate leading-none" title={label}>
            {label}
          </p>
        </div>
        {hint && <InfoIconButton open={open} onToggle={() => setOpen((o) => !o)} label={label} />}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0 mt-auto">
        <p className="text-3xl font-mono font-semibold tracking-tight break-words">{value}</p>
        {change && (
          <span
            className={`text-xs font-medium ${
              changePositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {hint && (
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
      )}
    </div>
  )
}
