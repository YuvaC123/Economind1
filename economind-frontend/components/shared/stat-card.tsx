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
    <div className="card-glass min-w-0">
      <div className="flex items-center gap-2 mb-3 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground leading-snug">{label}</p>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
        <p className="text-xl font-mono font-semibold break-words">{value}</p>
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
