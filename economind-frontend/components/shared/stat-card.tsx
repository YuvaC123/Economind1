import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: string
  changePositive?: boolean
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changePositive,
}: StatCardProps) {
  return (
    <div className="card-glass min-w-0 p-5 flex flex-col">
      <div className="flex items-center gap-1.5 h-5 mb-3 min-w-0 flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground truncate leading-none" title={label}>
          {label}
        </p>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0 mt-auto">
        <p className="text-3xl font-mono font-semibold tracking-tight break-words">{value}</p>
        {change && (
          <span
            className={`text-xs font-medium ${
              changePositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  )
}
