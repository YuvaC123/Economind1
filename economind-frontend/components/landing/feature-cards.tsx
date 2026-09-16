'use client'

import { motion } from 'framer-motion'

const features = [
  {
    index: '01',
    title: 'Behavioral Economics',
    description: 'Analyze how real consumers deviate from rational economic models',
  },
  {
    index: '02',
    title: 'Macroeconomic Scenarios',
    description: 'Test consumer behavior across different economic conditions',
  },
  {
    index: '03',
    title: 'Advanced Analytics',
    description: 'Visualize spending patterns, savings decisions, and investment choices',
  },
  {
    index: '04',
    title: 'Real-time Simulation',
    description: 'Run instant simulations with your custom personas and scenarios',
  },
]

export function FeatureCards() {
  return (
    <section id="features" className="py-20 px-6 scroll-mt-16">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">Features</p>
          <h2 className="font-heading text-3xl md:text-4xl font-medium mb-3 tracking-tight">
            Built for research
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Everything you need to understand consumer economic behavior and validate economic
            theories
          </p>
        </motion.div>

        <div className="border-t border-border">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="py-7 flex items-start gap-6 border-b border-border"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' }}
            >
              <span className="font-heading text-3xl text-primary/60 flex-shrink-0 w-14 tabular-nums">
                {feature.index}
              </span>
              <div>
                <h3 className="font-medium mb-1.5">{feature.title}</h3>
                <p className="text-muted-foreground text-sm max-w-md">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
