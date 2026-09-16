'use client'

import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { BehavioralTraits } from '@/components/dashboard/behavioral-traits'
import { EditPersonaModal } from '@/components/dashboard/edit-persona-modal'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, GripVertical, Loader2 } from 'lucide-react'
import { Persona } from '@/lib/mock-data'
import { useAuth } from '@/lib/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// Backend Persona rows use snake_case field names — map to/from the frontend's camelCase shape.
type ApiPersona = {
  id: string
  name: string
  age: number
  gender: string | null
  education: string | null
  income: number
  wealth: number
  savings: number
  debt: number
  monthly_expenses: number
  risk_appetite: string
  spending_behavior: string | null
  saving_preference: string | null
  investment_preference: string | null
}

function fromApiPersona(p: ApiPersona): Persona {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: (p.gender as Persona['gender']) ?? 'other',
    education: (p.education as Persona['education']) ?? 'bachelors',
    income: p.income,
    wealth: p.wealth,
    savings: p.savings,
    debt: p.debt,
    monthlyExpenses: p.monthly_expenses,
    riskAppetite: p.risk_appetite as Persona['riskAppetite'],
    spendingBehavior: (p.spending_behavior as Persona['spendingBehavior']) ?? 'balanced',
    savingPreference: (p.saving_preference as Persona['savingPreference']) ?? 'retirement',
    investmentPreference: (p.investment_preference as Persona['investmentPreference']) ?? 'diversified',
  }
}

function toApiPersona(p: Persona) {
  return {
    name: p.name,
    age: p.age,
    gender: p.gender,
    education: p.education,
    income: p.income,
    wealth: p.wealth,
    savings: p.savings,
    debt: p.debt,
    monthly_expenses: p.monthlyExpenses,
    risk_appetite: p.riskAppetite,
    spending_behavior: p.spendingBehavior,
    saving_preference: p.savingPreference,
    investment_preference: p.investmentPreference,
  }
}


const BLANK_PERSONA: Omit<Persona, 'id'> = {
  name: 'New Persona',
  age: 30,
  gender: 'other',
  education: 'bachelors',
  income: 60000,
  wealth: 50000,
  savings: 10000,
  debt: 5000,
  monthlyExpenses: 3000,
  riskAppetite: 'moderate',
  spendingBehavior: 'balanced',
  savingPreference: 'retirement',
  investmentPreference: 'diversified',
}

export default function PersonaBuilderPage() {
  const { token } = useAuth()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function loadPersonas() {
      try {
        const res = await fetch(`${API_URL}/personas`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.msg ?? 'Failed to load personas')
        if (!cancelled) setPersonas((data.personas as ApiPersona[]).map(fromApiPersona))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load personas')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPersonas()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleSave = async (updated: Persona) => {
    if (!token || !updated.id) {
      setPersonas((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      return
    }
    try {
      const res = await fetch(`${API_URL}/personas/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(toApiPersona(updated)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.msg ?? 'Update failed')
      const saved = fromApiPersona(data.persona as ApiPersona)
      setPersonas((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update persona')
    }
  }

  const handleDelete = async (persona: Persona) => {
    if (!window.confirm(`Delete ${persona.name}? This can't be undone.`)) return
    const previous = personas
    setPersonas((prev) => prev.filter((p) => p.id !== persona.id))
    try {
      const res = await fetch(`${API_URL}/personas/${persona.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
    } catch {
      setPersonas(previous)
      setError('Failed to delete persona — please try again.')
    }
  }

  const handleNewPersona = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/new-persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(toApiPersona({ ...BLANK_PERSONA, id: '' })),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.msg ?? 'Failed to create persona')
      const created = fromApiPersona(data.persona as ApiPersona)
      setPersonas((prev) => [created, ...prev])
      setEditingPersona(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create persona')
    }
  }

  return (
        <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-medium mb-1">Persona Builder</h2>
        <p className="text-muted-foreground">Create and manage consumer personas for simulations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personas List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Button className="gap-2" onClick={handleNewPersona}>
              <Plus className="w-4 h-4" />
              New Persona
            </Button>
            <p className="text-xs text-muted-foreground hidden sm:block">Drag to reorder</p>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading personas…
            </div>
          ) : personas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No personas yet — create one to get started.
            </p>
          ) : (
            <Reorder.Group axis="y" values={personas} onReorder={setPersonas} className="grid gap-4">
              {personas.map((persona) => (
                <PersonaListItem
                  key={persona.id}
                  persona={persona}
                  onEdit={() => setEditingPersona(persona)}
                  onDelete={() => handleDelete(persona)}
                />
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Behavioral Traits Sidebar */}
        <div className="lg:col-span-1">
          <BehavioralTraits />
        </div>
      </div>

      <EditPersonaModal
        persona={editingPersona}
        onClose={() => setEditingPersona(null)}
        onSave={handleSave}
      />
    </div>
  )
}

function PersonaListItem({
  persona,
  onEdit,
  onDelete,
}: {
  persona: Persona
  onEdit: () => void
  onDelete: () => void
}) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={persona}
      dragListener={false}
      dragControls={dragControls}
      className="rounded-xl p-6 bg-card border border-border transition-colors duration-200"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-grab active:cursor-grabbing p-1 -m-1 touch-none rounded-md hover:bg-muted transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
            {persona.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-medium">{persona.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">
              Age: {persona.age} &bull; Income: ${(persona.income / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" title="Edit persona" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete persona" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Reorder.Item>
  )
}
