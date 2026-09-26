'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, Lightbulb, Brain, ChevronRight } from 'lucide-react'

interface RightPanelProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function RightPanel({ isOpen = true, onToggle }: RightPanelProps) {
  if (!isOpen) return null

  return (
    <aside className="h-full flex-shrink-0 rounded-2xl border border-border bg-sidebar shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_20px_-6px_rgba(0,0,0,0.32)] flex flex-col w-80">
      <Tabs defaultValue="insights" className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <TabsList className="grid flex-1 grid-cols-3">
            <TabsTrigger value="insights" className="text-xs">
              Insights
            </TabsTrigger>
            <TabsTrigger value="theory" className="text-xs">
              Theory
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              Analysis
            </TabsTrigger>
          </TabsList>
          <button
            onClick={onToggle}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors hover-glow"
            title="Close insights"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-5 pb-5">
            <TabsContent value="insights" className="divide-y divide-border mt-0">
              <InsightItem
                icon={TrendingUp}
                title="Consumer Confidence"
                value="72%"
                change="+5% from last week"
              />
              <InsightItem
                icon={Brain}
                title="Behavioral Alignment"
                value="68%"
                change="Moderate deviation"
              />
              <InsightItem
                icon={Lightbulb}
                title="Key Finding"
                value="Risk-Averse"
                change="During high inflation"
              />
            </TabsContent>

            <TabsContent value="theory" className="divide-y divide-border mt-0">
              <TheoryCard
                theory="Rational Choice"
                alignment="71%"
                description="Consumer closely follows economic rationality"
              />
              <TheoryCard
                theory="Behavioral Economics"
                alignment="68%"
                description="Exhibits behavioral biases in decisions"
              />
              <TheoryCard
                theory="Keynesian Theory"
                alignment="62%"
                description="Consumption follows income changes"
              />
            </TabsContent>

            <TabsContent value="analysis" className="divide-y divide-border mt-0">
              <AnalysisItem
                label="Spending Velocity"
                value="High"
                description="Consumer responds quickly to changes"
              />
              <AnalysisItem
                label="Savings Rate"
                value="Moderate"
                description="18% of disposable income"
              />
              <AnalysisItem
                label="Debt Tolerance"
                value="Conservative"
                description="Avoids high-debt scenarios"
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  )
}

function InsightItem({
  icon: Icon,
  title,
  value,
  change,
}: {
  icon: typeof TrendingUp
  title: string
  value: string
  change: string
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-base font-mono font-semibold mt-1 text-primary">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{change}</p>
        </div>
      </div>
    </div>
  )
}

function TheoryCard({
  theory,
  alignment,
  description,
}: {
  theory: string
  alignment: string
  description: string
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium">{theory}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <span className="text-sm font-semibold flex-shrink-0">{alignment}</span>
      </div>
    </div>
  )
}

function AnalysisItem({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <span className="text-sm font-semibold flex-shrink-0">{value}</span>
      </div>
    </div>
  )
}
