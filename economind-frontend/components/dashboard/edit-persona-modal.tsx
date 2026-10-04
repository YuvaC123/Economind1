'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Persona } from '@/lib/mock-data'

// Covers the typical persona range with real precision; the number input
// next to it still accepts anything up to the $100M validation ceiling.
const INCOME_SLIDER_MAX = 500_000
const INCOME_SLIDER_STEP = 1_000

interface EditPersonaModalProps {
  persona: Persona | null
  onClose: () => void
  onSave: (updated: Persona) => void
}

const fieldClass =
  'mt-1.5 w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30'
// Dollar figures get a monospace, tabular-nums treatment so digits line up
// and match the monospace income range display above them.
const numericFieldClass = `${fieldClass} font-mono tabular-nums`

// Label + a small (i) icon that reveals a one-line definition on click.
// Click rather than hover so it works on touch devices too.
function FieldLabel({ text, hint, trailing }: { text: string; hint: string; trailing?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{text}</label>
          <motion.button
            type="button"
            onClick={() => setOpen((o) => !o)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8, rotate: open ? 160 : 20 }}
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 15 }}
            className={`flex items-center justify-center p-1 rounded-full cursor-pointer transition-colors duration-150 ${
              open ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
            aria-label={`What does "${text}" mean?`}
            aria-expanded={open}
          >
            <Info className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {trailing}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 6 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}

export function EditPersonaModal({ persona, onClose, onSave }: EditPersonaModalProps) {
  const [form, setForm] = useState<Persona | null>(persona)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setForm(persona)
    setValidationError(null)
  }, [persona])

  useEffect(() => {
    if (!persona) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [persona, onClose])

  if (!persona || !form) return null

  const update = <K extends keyof Persona>(key: K, value: Persona[K]) => {
    setValidationError(null)
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      setValidationError('Persona name is required')
      return
    }
    if (form.name.length > 50) {
      setValidationError('Persona name cannot exceed 50 characters')
      return
    }
    if (form.age < 1 || form.age > 120) {
      setValidationError('Age must be between 1 and 120')
      return
    }
    if (form.incomeMin < 0 || form.incomeMax < 0) {
      setValidationError('Income cannot be negative')
      return
    }
    if (form.incomeMax < form.incomeMin) {
      setValidationError('Income max must be greater than or equal to income min')
      return
    }
    if (form.savings < 0) {
      setValidationError('Savings cannot be negative')
      return
    }
    if (form.debt < 0) {
      setValidationError('Debt cannot be negative')
      return
    }
    if (form.monthlyExpenses < 0) {
      setValidationError('Monthly expenses cannot be negative')
      return
    }

    onSave({
      ...form,
      name: form.name.trim(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close edit persona"
        className="absolute inset-0 bg-foreground/20 cursor-pointer"
        onClick={onClose}
      />

      <div className="relative bg-card rounded-xl border border-border shadow-lg w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors hover-glow"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-semibold text-lg mb-1.5">Edit persona</h3>
        <p className="text-sm text-muted-foreground mb-7">Update demographic and financial details</p>

        {validationError && (
          <div className="mb-5 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {validationError}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={form.age}
                onChange={(e) => update('age', Number(e.target.value))}
                className={numericFieldClass}
              />
            </div>
            <div>
              <FieldLabel text="Risk appetite" hint="How much investment risk they're comfortable taking." />
              <select
                value={form.riskAppetite}
                onChange={(e) => update('riskAppetite', e.target.value as Persona['riskAppetite'])}
                className={fieldClass}
              >
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel
              text="Income range ($/yr)"
              hint="Gross (before-tax) annual income. The simulation estimates taxes and budgets from take-home pay, not this raw figure."
              trailing={
                <span className="text-sm font-mono font-semibold text-primary">
                  ${form.incomeMin.toLocaleString()} – ${form.incomeMax.toLocaleString()}
                </span>
              }
            />
            <Slider
              className="mt-2.5 mb-1"
              value={[
                Math.min(form.incomeMin, INCOME_SLIDER_MAX),
                Math.min(form.incomeMax, INCOME_SLIDER_MAX),
              ]}
              onValueChange={(v) => {
                const [next_min, next_max] = Array.isArray(v) ? v : [v as number, v as number]
                setValidationError(null)
                setForm((prev) =>
                  prev ? { ...prev, incomeMin: Math.min(next_min, next_max), incomeMax: Math.max(next_min, next_max) } : prev
                )
              }}
              min={0}
              max={INCOME_SLIDER_MAX}
              step={INCOME_SLIDER_STEP}
            />
            <div className="flex items-center justify-between mt-3 gap-3">
              <span className="text-xs text-muted-foreground flex-shrink-0">$0</span>
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.incomeMin}
                  onChange={(e) => update('incomeMin', Number(e.target.value))}
                  className="w-28 px-2.5 py-1.5 border border-border rounded-md text-xs font-mono tabular-nums text-right bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Exact minimum — the slider caps at $500K, type any amount here"
                />
                <span className="text-xs text-muted-foreground flex-shrink-0">to</span>
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.incomeMax}
                  onChange={(e) => update('incomeMax', Number(e.target.value))}
                  className="w-28 px-2.5 py-1.5 border border-border rounded-md text-xs font-mono tabular-nums text-right bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Exact maximum — the slider caps at $500K, type any amount here"
                />
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">${INCOME_SLIDER_MAX.toLocaleString()}+</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel
                text="Wealth ($)"
                hint="Total net worth — all assets combined (investments, property equity, retirement accounts)."
              />
              <input
                type="number"
                required
                min={-10000000}
                max={1000000000}
                value={form.wealth}
                onChange={(e) => update('wealth', Number(e.target.value))}
                className={numericFieldClass}
              />
            </div>
            <div>
              <FieldLabel
                text="Savings ($)"
                hint="Liquid cash on hand, e.g. checking/savings balance — a slice of wealth, not the whole thing."
              />
              <input
                type="number"
                required
                min={0}
                max={100000000}
                value={form.savings}
                onChange={(e) => update('savings', Number(e.target.value))}
                className={numericFieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel
                text="Debt ($)"
                hint="Total outstanding liabilities — loans, credit cards, mortgage balance owed."
              />
              <input
                type="number"
                required
                min={0}
                max={100000000}
                value={form.debt}
                onChange={(e) => update('debt', Number(e.target.value))}
                className={numericFieldClass}
              />
            </div>
            <div>
              <FieldLabel
                text="Monthly expenses ($)"
                hint="Recurring monthly costs — rent, bills, groceries — before any spending the simulation decides."
              />
              <input
                type="number"
                required
                min={0}
                max={10000000}
                value={form.monthlyExpenses}
                onChange={(e) => update('monthlyExpenses', Number(e.target.value))}
                className={numericFieldClass}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
