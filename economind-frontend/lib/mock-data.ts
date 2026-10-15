// Personas are built from categorical ranges, not exact point values, so the
// same simulation stays valid across the variance within a cohort. These
// mirror the brackets/bands defined server-side in economind-backend/index.ts.
export const AGE_BRACKETS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const
export type AgeBracket = (typeof AGE_BRACKETS)[number]
// Legacy numeric `age` is derived from the bracket's floor, for any display
// that still wants a plain number.
export const AGE_BRACKET_FLOOR: Record<AgeBracket, number> = {
  '18-24': 18,
  '25-34': 25,
  '35-44': 35,
  '45-54': 45,
  '55-64': 55,
  '65+': 65,
}

// Monthly expenses are set as a % of take-home income within a band, via a
// slider constrained to that band's range — not a bare dollar figure.
export const EXPENSE_BANDS = ['lean', 'moderate', 'comfortable', 'high'] as const
export type ExpenseBand = (typeof EXPENSE_BANDS)[number]
export const EXPENSE_BAND_RANGE: Record<ExpenseBand, [number, number]> = {
  lean: [0.1, 0.25],
  moderate: [0.25, 0.45],
  comfortable: [0.45, 0.65],
  high: [0.65, 0.85],
}
export const EXPENSE_BAND_LABELS: Record<ExpenseBand, string> = {
  lean: 'Lean',
  moderate: 'Moderate',
  comfortable: 'Comfortable',
  high: 'High',
}

// Fallbacks for personas created before this field existed — the API may
// still return `age_bracket`/`expense_band` as null for those rows.
export function inferAgeBracket(age: number): AgeBracket {
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  if (age < 65) return '55-64'
  return '65+'
}

export function inferExpenseBand(monthlyExpenses: number, monthlyIncome: number): ExpenseBand {
  const pct = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 0.35
  if (pct < EXPENSE_BAND_RANGE.lean[1]) return 'lean'
  if (pct < EXPENSE_BAND_RANGE.moderate[1]) return 'moderate'
  if (pct < EXPENSE_BAND_RANGE.comfortable[1]) return 'comfortable'
  return 'high'
}

export interface Persona {
  id: string
  name: string
  // age is a legacy derived value (the bracket's floor); ageBracket is the
  // source of truth.
  age: number
  ageBracket: AgeBracket
  gender: 'male' | 'female' | 'other'
  education: 'high-school' | 'bachelors' | 'masters' | 'phd'
  // Take-home (after-tax, after-deductions) annual income range — not gross.
  incomeMin: number
  incomeMax: number
  wealth: number
  // savings is a legacy derived sum of the three horizons below.
  savings: number
  savingsShortTerm: number
  savingsMidTerm: number
  savingsLongTerm: number
  debt: number
  monthlyExpenses: number
  expenseBand: ExpenseBand
  riskAppetite: 'conservative' | 'moderate' | 'aggressive'
  spendingBehavior: 'frugal' | 'balanced' | 'lavish'
  savingPreference: 'emergency' | 'retirement' | 'investment'
  investmentPreference: 'stocks' | 'bonds' | 'real-estate' | 'diversified'
}

export interface MacroeconomicEnvironment {
  inflation: number
  interestRate: number
  gdpGrowth: number
  unemployment: number
  wageGrowth: number
  housingPrices: number
  energyPrices: number
  aiAdoption: number
  marketConfidence: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  macro: MacroeconomicEnvironment
  type: 'predefined' | 'custom'
}

export interface SimulationResult {
  id: string
  personaId: string
  scenarioId: string
  decisions: {
    spending: number
    saving: number
    borrowing: number
    investing: number
  }
  confidence: {
    spending: number
    saving: number
    borrowing: number
    investing: number
  }
  behavioralTraits: {
    riskTolerance: number
    futureOrientation: number
    impulsivity: number
    socialConformity: number
  }
  theoryAlignment: {
    rationalChoice: number
    behavioralEconomics: number
    keynesianEconomics: number
    austrianEconomics: number
  }
  reasoning: string[]
  timestamp: Date
}

export const DEFAULT_PERSONA: Persona = {
  id: 'persona-1',
  name: 'John Doe',
  age: 35,
  ageBracket: '35-44',
  gender: 'male',
  education: 'masters',
  incomeMin: 75000,
  incomeMax: 95000,
  wealth: 250000,
  savings: 45000,
  savingsShortTerm: 15000,
  savingsMidTerm: 15000,
  savingsLongTerm: 15000,
  debt: 15000,
  monthlyExpenses: 3500,
  expenseBand: 'comfortable', // ~49% of take-home pay
  riskAppetite: 'moderate',
  spendingBehavior: 'balanced',
  savingPreference: 'retirement',
  investmentPreference: 'diversified',
}

export const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: 'scenario-1',
    name: 'Low Inflation Economy',
    description: 'Stable economic conditions with low inflation and moderate growth',
    type: 'predefined',
    macro: {
      inflation: 2.0,
      interestRate: 4.5,
      gdpGrowth: 2.8,
      unemployment: 4.2,
      wageGrowth: 2.5,
      housingPrices: 105,
      energyPrices: 85,
      aiAdoption: 35,
      marketConfidence: 72,
    },
  },
  {
    id: 'scenario-2',
    name: 'High Inflation Scenario',
    description: 'Economic stress with elevated inflation and rising interest rates',
    type: 'predefined',
    macro: {
      inflation: 7.5,
      interestRate: 8.2,
      gdpGrowth: 1.2,
      unemployment: 5.8,
      wageGrowth: 3.2,
      housingPrices: 92,
      energyPrices: 142,
      aiAdoption: 28,
      marketConfidence: 45,
    },
  },
  {
    id: 'scenario-3',
    name: 'AI Revolution Boom',
    description: 'High growth period driven by AI adoption and technological innovation',
    type: 'predefined',
    macro: {
      inflation: 3.2,
      interestRate: 5.5,
      gdpGrowth: 4.5,
      unemployment: 3.1,
      wageGrowth: 4.8,
      housingPrices: 118,
      energyPrices: 88,
      aiAdoption: 72,
      marketConfidence: 85,
    },
  },
  {
    id: 'scenario-4',
    name: 'Recession Conditions',
    description: 'Economic contraction with rising unemployment and declining growth',
    type: 'predefined',
    macro: {
      inflation: 2.1,
      interestRate: 2.8,
      gdpGrowth: -1.5,
      unemployment: 8.5,
      wageGrowth: -0.5,
      housingPrices: 78,
      energyPrices: 72,
      aiAdoption: 22,
      marketConfidence: 28,
    },
  },
  {
    id: 'scenario-5',
    name: 'Stagflation',
    description: 'High inflation combined with stagnant growth and rising unemployment',
    type: 'predefined',
    macro: {
      inflation: 8.5,
      interestRate: 9.0,
      gdpGrowth: -0.5,
      unemployment: 8.0,
      wageGrowth: 1.0,
      housingPrices: 88,
      energyPrices: 165,
      aiAdoption: 30,
      marketConfidence: 22,
    },
  },
  {
    id: 'scenario-6',
    name: 'Post-Pandemic Recovery',
    description: 'Rebounding growth and easing unemployment after a sharp economic disruption',
    type: 'predefined',
    macro: {
      inflation: 3.5,
      interestRate: 3.0,
      gdpGrowth: 5.2,
      unemployment: 4.5,
      wageGrowth: 4.0,
      housingPrices: 112,
      energyPrices: 95,
      aiAdoption: 40,
      marketConfidence: 78,
    },
  },
  {
    id: 'scenario-7',
    name: 'Housing Market Correction',
    description: 'Falling housing prices and cooling demand amid tighter credit conditions',
    type: 'predefined',
    macro: {
      inflation: 2.8,
      interestRate: 6.5,
      gdpGrowth: 0.8,
      unemployment: 5.5,
      wageGrowth: 1.8,
      housingPrices: 68,
      energyPrices: 90,
      aiAdoption: 38,
      marketConfidence: 40,
    },
  },
  {
    id: 'scenario-8',
    name: 'Energy Crisis',
    description: 'Sharp spike in energy prices driving inflation and squeezing household budgets',
    type: 'predefined',
    macro: {
      inflation: 6.8,
      interestRate: 6.0,
      gdpGrowth: 0.5,
      unemployment: 6.2,
      wageGrowth: 1.5,
      housingPrices: 98,
      energyPrices: 185,
      aiAdoption: 32,
      marketConfidence: 33,
    },
  },
]

export const ECONOMIC_INDICATORS = [
  { label: 'Inflation Rate (%)', key: 'inflation', min: 0, max: 12, step: 0.5 },
  { label: 'Interest Rate (%)', key: 'interestRate', min: 0, max: 10, step: 0.5 },
  { label: 'GDP Growth (%)', key: 'gdpGrowth', min: -3, max: 6, step: 0.5 },
  { label: 'Unemployment (%)', key: 'unemployment', min: 2, max: 12, step: 0.5 },
  { label: 'Wage Growth (%)', key: 'wageGrowth', min: -2, max: 8, step: 0.5 },
  { label: 'Housing Prices (index)', key: 'housingPrices', min: 50, max: 150, step: 5 },
  { label: 'Energy Prices (index)', key: 'energyPrices', min: 40, max: 200, step: 10 },
  { label: 'AI Adoption (%)', key: 'aiAdoption', min: 0, max: 100, step: 5 },
  { label: 'Market Confidence (index)', key: 'marketConfidence', min: 0, max: 100, step: 5 },
]
