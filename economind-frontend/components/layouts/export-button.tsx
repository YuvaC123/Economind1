'use client'

import { useState } from 'react'
import { Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEFAULT_PERSONA, PREDEFINED_SCENARIOS } from '@/lib/mock-data'

export function ExportButton() {
  const [justExported, setJustExported] = useState(false)

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      persona: DEFAULT_PERSONA,
      scenarios: PREDEFINED_SCENARIOS,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `economind-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setJustExported(true)
    setTimeout(() => setJustExported(false), 1800)
  }

  return (
    <Button variant="ghost" size="icon" title="Export data" onClick={handleExport}>
      {justExported ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Download className="w-4 h-4" />
      )}
    </Button>
  )
}
