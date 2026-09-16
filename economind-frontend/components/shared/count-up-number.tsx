'use client'

import { useEffect, useState } from 'react'
import { AnimatedNumber } from '@/components/shared/animated-number'

interface CountUpNumberProps {
  target: number
  format?: (n: number) => string
  className?: string
}

export function CountUpNumber({ target, format, className }: CountUpNumberProps) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    setValue(0)
    const id = setTimeout(() => setValue(target), 80)
    return () => clearTimeout(id)
  }, [target])

  return <AnimatedNumber value={value} format={format} className={className} />
}
