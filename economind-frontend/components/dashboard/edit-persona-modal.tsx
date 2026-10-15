'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { InfoIconButton } from '@/components/shared/info-icon-button'
import {
  AGE_BRACKETS,
  AGE_BRACKET_FLOOR,
  EXPENSE_BANDS,
  EXPENSE_BAND_RANGE,
  EXPENSE_BAND_LABELS,
  ExpenseBand,
  Persona,
} from '@/lib/mock-data'

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
          <InfoIconButton open={open} onToggle={() => setOpen((o) => !o)} label={text} />
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

function monthlyIncomeOf(p: Pick<Persona, 'incomeMin' | 'incomeMax'>): number {
  return (p.incomeMin + p.incomeMax) / 2 / 12
}

export function EditPersonaModal({ persona, onClose, onSave }: EditPersonaModalProps) {
  const [form, setForm] = useState<Persona | null>(persona)
  const [validationError, setValidationError] = useState<string | null>(null)
  // The expense slider works in percent-of-income within the selected band;
  // the dollar amount sent to the API is derived from this, not the other
  // way around.
  const [expensePct, setExpensePct] = useState(0)

  useEffect(() => {
    setForm(persona)
    setValidationError(null)
    if (persona) {
      const income = monthlyIncomeOf(persona)
      const raw = income > 0 ? Math.round((persona.monthlyExpenses / income) * 100) : bandMidpoint(persona.expenseBand)
      // Clamp to the selected band's own range — a persona's stored dollar
      // figure and its band label can drift out of sync (e.g. legacy data),
      // and the slider itself can't visually show a value outside its band.
      const [bandMin, bandMax] = EXPENSE_BAND_RANGE[persona.expenseBand]
      setExpensePct(Math.max(Math.round(bandMin * 100), Math.min(Math.round(bandMax * 100), raw)))
    }
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

  const updateSavingsHorizon = (
    key: 'savingsShortTerm' | 'savingsMidTerm' | 'savingsLongTerm',
    value: number
  ) => {
    setValidationError(null)
    setForm((prev) => {
      if (!prev) return prev
      const next = { ...prev, [key]: value }
      return { ...next, savings: next.savingsShortTerm + next.savingsMidTerm + next.savingsLongTerm }
    })
  }

  const monthlyIncome = monthlyIncomeOf(form)

  const updateExpenseBand = (band: ExpenseBand) => {
    const pct = bandMidpoint(band)
    setExpensePct(pct)
    setValidationError(null)
    setForm((prev) => (prev ? { ...prev, expenseBand: band, monthlyExpenses: Math.round((pct / 100) * monthlyIncomeOf(prev)) } : prev))
  }

  const updateExpensePct = (pct: number) => {
    setExpensePct(pct)
    setValidationError(null)
    setForm((prev) => (prev ? { ...prev, monthlyExpenses: Math.round((pct / 100) * monthlyIncomeOf(prev)) } : prev))
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
    if (form.incomeMin < 0 || form.incomeMax < 0) {
      setValidationError('Income cannot be negative')
      return
    }
    if (form.incomeMax < form.incomeMin) {
      setValidationError('Income max must be greater than or equal to income min')
      return
    }
    if (form.savingsShortTerm < 0 || form.savingsMidTerm < 0 || form.savingsLongTerm < 0) {
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
      age: AGE_BRACKET_FLOOR[form.ageBracket],
    })
    onClose()
  }

  const expenseRange = EXPENSE_BAND_RANGE[form.expenseBand]

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
              <FieldLabel
                text="Age"
                hint="A cohort, not one exact age — personas stay valid across the natural variance within an age range rather than overfitting to a single year."
              />
              <select
                value={form.ageBracket}
                onChange={(e) => update('ageBracket', e.target.value as Persona['ageBracket'])}
                className={fieldClass}
              >
                {AGE_BRACKETS.map((bracket) => (
                  <option key={bracket} value={bracket}>
                    {bracket}
                  </option>
                ))}
              </select>
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
              hint="Take-home (after-tax, after-deductions) annual income — what actually lands in the bank, not gross pay. This is what's comparable across tax jurisdictions and what funds the budget directly."
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
                hint="Total net worth — all assets combined (investments, property equity, retirement accounts), minus liabilities. A shock-resilience buffer: high wealth relative to income means a persona can absorb a rate spike or recession with less behavior change; low wealth means the same shock hits harder."
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
          </div>

          <div>
            <FieldLabel
              text="Savings, by horizon ($)"
              hint="Split by time horizon because each behaves differently under economic stress — a single aggregate number hides that. Short-term is the emergency buffer, drawn down first; long-term is retirement money that shouldn't move much over one bad quarter."
              trailing={
                <span className="text-sm font-mono font-semibold text-primary">
                  ${form.savings.toLocaleString()} total
                </span>
              }
            />
            <div className="grid grid-cols-3 gap-3 mt-2.5">
              <div>
                <label className="text-xs text-muted-foreground">Short-term (0-12mo)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.savingsShortTerm}
                  onChange={(e) => updateSavingsHorizon('savingsShortTerm', Number(e.target.value))}
                  className="mt-1 w-full px-2.5 py-2 border border-border rounded-md text-xs font-mono tabular-nums bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Emergency fund, near-term purchases — highly sensitive to inflation and rate changes"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Mid-term (1-5yr)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.savingsMidTerm}
                  onChange={(e) => updateSavingsHorizon('savingsMidTerm', Number(e.target.value))}
                  className="mt-1 w-full px-2.5 py-2 border border-border rounded-md text-xs font-mono tabular-nums bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Goals like a home deposit or a vehicle — moderately sensitive to macro stress"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Long-term (5yr+)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.savingsLongTerm}
                  onChange={(e) => updateSavingsHorizon('savingsLongTerm', Number(e.target.value))}
                  className="mt-1 w-full px-2.5 py-2 border border-border rounded-md text-xs font-mono tabular-nums bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Retirement, generational wealth — least sensitive to short-run shocks"
                />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel
              text="Monthly expenses"
              hint="Set as a share of take-home income within a band, not a bare dollar figure — recurring baseline costs (rent, bills, groceries) before any spending the simulation decides."
              trailing={
                <span className="text-sm font-mono font-semibold text-primary">
                  ${form.monthlyExpenses.toLocaleString()}/mo
                </span>
              }
            />
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {EXPENSE_BANDS.map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => updateExpenseBand(band)}
                  className={`px-2 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    form.expenseBand === band
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {EXPENSE_BAND_LABELS[band]}
                </button>
              ))}
            </div>
            <Slider
              className="mt-3 mb-1"
              value={[expensePct]}
              onValueChange={(v) => updateExpensePct(Array.isArray(v) ? v[0] : (v as number))}
              min={Math.round(expenseRange[0] * 100)}
              max={Math.round(expenseRange[1] * 100)}
              step={1}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">{Math.round(expenseRange[0] * 100)}%</span>
              <span className="text-xs text-muted-foreground">
                {expensePct}% of take-home pay (${Math.round(monthlyIncome).toLocaleString()}/mo)
              </span>
              <span className="text-xs text-muted-foreground">{Math.round(expenseRange[1] * 100)}%</span>
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

function bandMidpoint(band: ExpenseBand): number {
  const [min, max] = EXPENSE_BAND_RANGE[band]
  return Math.round(((min + max) / 2) * 100)
}
