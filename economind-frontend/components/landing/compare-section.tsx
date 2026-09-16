'use client'

import { motion } from 'framer-motion'
import { ScenarioCompare } from '@/components/landing/scenario-compare'

export function CompareSection() {
  return (
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Compare</p>
          <h2 className="font-heading text-3xl md:text-4xl font-medium mb-3 tracking-tight">
            Same economy, two very different stories
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Drag the handle to see how far apart consumer confidence and unemployment can drift
            between economic conditions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          <ScenarioCompare />
        </motion.div>
      </div>
    </section>
  )
}
