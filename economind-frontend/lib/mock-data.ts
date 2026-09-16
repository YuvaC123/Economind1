export interface Persona {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  education: 'high-school' | 'bachelors' | 'masters' | 'phd'
  income: number
  wealth: number
  savings: number
  debt: number
  monthlyExpenses: number
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
  gender: 'male',
  education: 'masters',
  income: 85000,
  wealth: 250000,
  savings: 45000,
  debt: 15000,
  monthlyExpenses: 3500,
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
