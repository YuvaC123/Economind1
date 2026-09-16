'use client'

import { useEffect, useState } from 'react'
import { useSpring } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  className?: string
}

export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 140, damping: 22, mass: 0.4 })
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => setDisplay(v))
    return unsubscribe
  }, [spring])

  return <span className={className}>{format ? format(display) : Math.round(display)}</span>
}
