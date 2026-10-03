'use client'

import { useEffect, useState } from 'react'
import { X, Save } from 'lucide-react'
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
  'mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30'

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

      <div className="relative bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors hover-glow"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-semibold mb-1">Edit persona</h3>
        <p className="text-sm text-muted-foreground mb-6">Update demographic and financial details</p>

        {validationError && (
          <div className="mb-4 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {validationError}
          </div>
        )}

        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={form.age}
                onChange={(e) => update('age', Number(e.target.value))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Risk appetite</label>
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Income range ($/yr)</label>
              <span className="text-sm font-mono font-semibold text-primary">
                ${form.incomeMin.toLocaleString()} – ${form.incomeMax.toLocaleString()}
              </span>
            </div>
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
            <div className="flex items-center justify-between mt-1 gap-2">
              <span className="text-xs text-muted-foreground flex-shrink-0">$0</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.incomeMin}
                  onChange={(e) => update('incomeMin', Number(e.target.value))}
                  className="w-24 px-2 py-1 border border-border rounded-md text-xs text-right bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Exact minimum — the slider caps at $500K, type any amount here"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={form.incomeMax}
                  onChange={(e) => update('incomeMax', Number(e.target.value))}
                  className="w-24 px-2 py-1 border border-border rounded-md text-xs text-right bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title="Exact maximum — the slider caps at $500K, type any amount here"
                />
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">${INCOME_SLIDER_MAX.toLocaleString()}+</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Wealth ($)</label>
              <input
                type="number"
                required
                min={-10000000}
                max={1000000000}
                value={form.wealth}
                onChange={(e) => update('wealth', Number(e.target.value))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Savings ($)</label>
              <input
                type="number"
                required
                min={0}
                max={100000000}
                value={form.savings}
                onChange={(e) => update('savings', Number(e.target.value))}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Debt ($)</label>
              <input
                type="number"
                required
                min={0}
                max={100000000}
                value={form.debt}
                onChange={(e) => update('debt', Number(e.target.value))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly expenses ($)</label>
              <input
                type="number"
                required
                min={0}
                max={10000000}
                value={form.monthlyExpenses}
                onChange={(e) => update('monthlyExpenses', Number(e.target.value))}
                className={fieldClass}
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
