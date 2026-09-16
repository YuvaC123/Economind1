'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/shared/magnetic'

export function CTASection() {
  const benefits = [
    'Create unlimited personas',
    'Test 8 predefined economic scenarios',
    'Analytics dashboard with spending, savings, and investment charts',
    'Export persona and scenario data as JSON',
    'Instant simulation results, no waiting',
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="card-glass text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h2 className="font-heading text-3xl font-medium mb-3 tracking-tight">Start simulating today</h2>
          <p className="text-muted-foreground mb-8">
            Explore how consumer personas respond to economic conditions — free to try, no account
            required to explore the dashboard.
          </p>

          <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: '-80px' }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
              >
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <Magnetic className="w-full sm:w-auto">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  )
}
