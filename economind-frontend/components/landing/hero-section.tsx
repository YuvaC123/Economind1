'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScenarioDemo } from '@/components/landing/scenario-demo'
import { Magnetic } from '@/components/shared/magnetic'

export function HeroSection() {
  return (
    <section className="relative px-6 pt-20 pb-28 overflow-hidden">
      {/* Ambient drifting dot grid - always moving, even before you touch anything */}
      <div className="dot-grid absolute inset-0 opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,black,transparent)]" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-medium mb-6 text-balance leading-[0.95] tracking-tight">
            How does a{' '}
            <span className="italic text-primary">recession</span>{' '}
            actually change what people do with their money?
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg text-balance">
            EconoMind simulates consumer personas under real macroeconomic conditions, so you can
            watch behavior shift instead of just reading a theory about it. Try the slider on the
            right.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Magnetic className="w-full sm:w-auto">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Launch Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Magnetic>
            <a href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See what it models
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          <ScenarioDemo />
        </motion.div>
      </div>
    </section>
  )
}
