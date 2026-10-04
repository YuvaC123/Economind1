'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'

interface InfoIconButtonProps {
  open: boolean
  onToggle: () => void
  label: string
  className?: string
}

// A small (i) button used throughout the app to reveal a definition for a
// label that might not be obvious. Click (not hover) so it works on touch.
// Each press fires a quick ripple pulse plus an overshooting spring rotation
// so the toggle has some tactile feedback instead of an instant flip.
export function InfoIconButton({ open, onToggle, label, className = '' }: InfoIconButtonProps) {
  const [pulseKey, setPulseKey] = useState(0)

  return (
    <motion.button
      type="button"
      onClick={() => {
        onToggle()
        setPulseKey((k) => k + 1)
      }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.72, rotate: open ? 135 : 35 }}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 11 }}
      className={`relative flex items-center justify-center p-1 rounded-full cursor-pointer transition-colors duration-150 ${
        open ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
      } ${className}`}
      aria-label={`What does "${label}" mean?`}
      aria-expanded={open}
    >
      <AnimatePresence>
        {pulseKey > 0 && (
          <motion.span
            key={pulseKey}
            initial={{ scale: 0.3, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-primary pointer-events-none"
          />
        )}
      </AnimatePresence>
      <Info className="w-3.5 h-3.5 relative" />
    </motion.button>
  )
}
