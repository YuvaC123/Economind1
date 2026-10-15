import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import prisma from './db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Groq } from 'groq-sdk'
import { z } from 'zod'
import { authMiddleware, AuthedRequest } from './middleware/auth.js'

const app = express()

// ─── CORS ─────────────────────────────────────────────────────────────────────
const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, ''))
  : []
const allowedOrigins = Array.from(
  new Set(['http://localhost:3000', 'http://localhost:3001', ...configuredOrigins])
)

// >>> START: CORS FIX (ALLOWS ALL VERCEL DOMAINS & PREVIEWS) <<<
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      const cleanOrigin = origin.replace(/\/$/, '')
      if (
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.includes('*') ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return cb(null, true)
      }
      cb(new Error(`CORS: origin '${origin}' not allowed`), false)
    },
    credentials: true,
  })
)
// <<< END: CORS FIX >>>

app.use(express.json())

// Normalize accidental double slashes in URL (e.g. //send-otp -> /send-otp)
app.use((req, _res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/')
  }
  next()
})

const JWT_SECRET = process.env.JWT_SECRET as string

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// >>> START: DIRECT SIGNUP SCHEMA (REPLACED OTP SCHEMAS) <<<
const SignupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must not exceed 50 characters'),
  email: z.string().trim().email('Invalid email address').max(100, 'Email must not exceed 100 characters'),
  password: z.string().min(6, 'Password must be between 6 and 64 characters').max(64, 'Password must not exceed 64 characters'),
})

const SigninSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(100, 'Email must not exceed 100 characters'),
  password: z.string().min(1, 'Password is required').max(64, 'Password must not exceed 64 characters'),
})
// <<< END: DIRECT SIGNUP SCHEMA >>>

// Personas are built from categorical ranges, not exact point values, so the
// same simulation stays valid across the natural variance within a cohort
// rather than overfitting to one specific number.
const AGE_BRACKETS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const
type AgeBracket = (typeof AGE_BRACKETS)[number]
// Legacy numeric `age` column is derived from the bracket's floor, purely so
// any code that still expects a plain number keeps working.
const AGE_BRACKET_FLOOR: Record<AgeBracket, number> = {
  '18-24': 18,
  '25-34': 25,
  '35-44': 35,
  '45-54': 45,
  '55-64': 55,
  '65+': 65,
}

// Monthly expenses are set as a proportional band of take-home income, not a
// bare dollar figure — the frontend computes the actual $ amount from a
// slider constrained to the band's percentage range and sends that number;
// the band itself is kept only as display/context metadata.
const EXPENSE_BANDS = ['lean', 'moderate', 'comfortable', 'high'] as const

const PersonaBaseSchema = z.object({
  name: z.string().trim().min(1, 'Persona name is required').max(50, 'Persona name must not exceed 50 characters'),
  age_bracket: z.enum(AGE_BRACKETS),
  gender: z.string().trim().max(30).optional().nullable(),
  education: z.string().trim().max(50).optional().nullable(),
  // income_min/income_max are TAKE-HOME (after-tax, after-deductions) pay —
  // comparable across tax jurisdictions, unlike gross pay. See systemPrompt
  // and the "EconoMind Decision Algorithm" write-up for the rationale.
  income_min: z.number().min(0, 'Income cannot be negative').max(100_000_000, 'Income exceeds maximum limit ($100M)'),
  income_max: z.number().min(0, 'Income cannot be negative').max(100_000_000, 'Income exceeds maximum limit ($100M)'),
  // Savings split by time horizon — each horizon behaves differently under
  // macro stress, so a single aggregate number hides that signal.
  savings_short_term: z.number().min(0, 'Short-term savings cannot be negative').max(100_000_000, 'Short-term savings exceeds maximum limit ($100M)'),
  savings_mid_term: z.number().min(0, 'Mid-term savings cannot be negative').max(100_000_000, 'Mid-term savings exceeds maximum limit ($100M)'),
  savings_long_term: z.number().min(0, 'Long-term savings cannot be negative').max(100_000_000, 'Long-term savings exceeds maximum limit ($100M)'),
  monthly_expenses: z.number().min(0, 'Monthly expenses cannot be negative').max(10_000_000, 'Monthly expenses exceeds limit ($10M)'),
  expense_band: z.enum(EXPENSE_BANDS),
  wealth: z.number().min(-10_000_000, 'Wealth is below minimum limit').max(1_000_000_000, 'Wealth exceeds limit ($1B)'),
  debt: z.number().min(0, 'Debt cannot be negative').max(100_000_000, 'Debt exceeds maximum limit ($100M)'),
  risk_appetite: z.string().min(1, 'Risk appetite is required').max(30),
  spending_behavior: z.string().trim().max(30).optional().nullable(),
  saving_preference: z.string().trim().max(30).optional().nullable(),
  investment_preference: z.string().trim().max(30).optional().nullable(),
})
const incomeRangeRefine = (data: { income_min?: number; income_max?: number }) =>
  data.income_min === undefined || data.income_max === undefined || data.income_max >= data.income_min
const incomeRangeIssue = {
  message: 'Income max must be greater than or equal to income min',
  path: ['income_max'],
}
const PersonaSchema = PersonaBaseSchema.refine(incomeRangeRefine, incomeRangeIssue)

const ScenarioSchema = z.object({
  scenario_name: z.string().min(1),
  inflation_rate: z.number(),
  interest_rate: z.number(),
  unemployment_rate: z.number(),
  market_volatility: z.number(),
})

//health check route
app.get("/health",async(req:Request,res:Response):Promise<any>=>{
    return res.status(202).json({'msg':"Server is up and healthy"})
})

// >>> START: DIRECT SIGNUP ROUTE (REPLACED OTP ROUTES) <<<
app.post("/signup", async (req: Request, res: Response): Promise<any> => {
    const parseResult = SignupSchema.safeParse(req.body)
    if (!parseResult.success) {
        return res.status(400).json({ 
            msg: parseResult.error.issues[0]?.message ?? "Invalid input" 
        })
    }

    const { name, email, password } = parseResult.data
    const normalizedEmail = email.trim().toLowerCase()

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        })

        if (existingUser) {
            return res.status(409).json({ 
                msg: "An account with this email already exists. Please log in." 
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: name.trim(),
                password: hashedPassword,
            }
        })

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '48h' })

        return res.status(201).json({
            msg: "Account created successfully",
            token,
            user: { id: user.id, email: user.email, name: user.name }
        })
    } catch (error) {
        console.error("signup error:", error)
        return res.status(500).json({ msg: "Failed to create account", error: String(error) })
    }
})
// <<< END: DIRECT SIGNUP ROUTE >>>

// ─── Signin Route (for existing accounts) ────────────────────────────────────
app.post("/signin", async (req: Request, res: Response): Promise<any> => {
    const parseResult = SigninSchema.safeParse(req.body)
    if (!parseResult.success) {
        return res.status(400).json({ 
            msg: parseResult.error.issues[0]?.message ?? "Invalid credentials" 
        })
    }

    const { email, password } = parseResult.data
    const normalizedEmail = email.trim().toLowerCase()

    try {
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        })

        if (!user) {
            return res.status(404).json({ msg: "No account found with this email. Please sign up." })
        }

        const checkPassword = await bcrypt.compare(password, user.password)
        if (checkPassword) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '48h' })
            return res.status(200).json({
                msg: "Signin successful",
                token,
                user: { id: user.id, email: user.email, name: user.name }
            })
        }
        return res.status(401).json({ msg: "Password is incorrect" })
    } catch (error) {
        return res.status(500).json({ msg: "Internal server error", error })
    }
})
// ─── Income ───────────────────────────────────────────────────────────────────
// income_min/income_max are TAKE-HOME pay (after income tax and all statutory
// deductions) directly, as entered by the user — not gross pay with tax
// estimated downstream. Take-home is what's actually comparable across tax
// jurisdictions (two people with different gross pay in different states can
// have identical take-home pay) and what funds the budget identity below
// directly, so there is no tax step here. See the "EconoMind Decision
// Algorithm" write-up for the full rationale and how this sets up future
// state-level modeling (deriving an equivalent gross from a target net,
// rather than the other way around).

// ─── Phillips Curve ──────────────────────────────────────────────────────────
// Short-run Phillips Curve: π = π_e − β(u − u_n) — inflation tends to run
// above the baseline when unemployment is below its "natural" rate (a tight
// labor market), and below baseline when unemployment is above it (slack).
// This relates two SCENARIO inputs (inflation, unemployment), not something
// the persona decided, so — like tax — it's computed deterministically here
// rather than left to the LLM to estimate.
const NATURAL_UNEMPLOYMENT_RATE = 4.5 // %, a commonly-cited NAIRU-ish baseline
const EXPECTED_INFLATION_BASELINE = 2.0 // %, roughly a central-bank inflation target
const PHILLIPS_SENSITIVITY = 0.5 // points of inflation per point of unemployment gap

function computePhillipsCurve(unemploymentRate: number, actualInflation: number) {
  const expectedInflation =
    EXPECTED_INFLATION_BASELINE - PHILLIPS_SENSITIVITY * (unemploymentRate - NATURAL_UNEMPLOYMENT_RATE)
  const gap = actualInflation - expectedInflation // + = inflation running hotter than the curve predicts
  // Alignment score (0-100): 100 when the scenario sits exactly on the
  // theoretical curve, decaying as it deviates — a 6-point gap (e.g. a
  // stagflation scenario with high inflation AND high unemployment) bottoms
  // out near 0.
  const alignment = Math.max(0, Math.min(100, Math.round(100 - Math.abs(gap) * 16.7)))
  return {
    unemploymentRate,
    actualInflation,
    expectedInflation: Math.round(expectedInflation * 10) / 10,
    gap: Math.round(gap * 10) / 10,
    alignment,
  }
}

const systemPrompt = `You are EconoMind's behavioral simulation engine.

Given a consumer persona and macroeconomic scenario, simulate how that persona would behave financially.

Persona field definitions (do not confuse these with each other):
- age_bracket: a demographic cohort (e.g. "25-34"), not one exact age —
  reason about this persona as representative of that range, not a single year.
- wealth: total net worth — all assets combined (investments, property
  equity, retirement accounts), minus liabilities. This is NOT spendable
  cash, but it IS a shock-resilience buffer: a persona with HIGH wealth
  relative to income should react to adverse scenarios (inflation spikes,
  rate hikes, recession) with MORE STABLE, less reactive decisions — they
  can absorb the shock from existing assets without much behavior change. A
  persona with LOW wealth relative to income should react with MORE
  VOLATILE, more reactive decisions — they have little buffer, so a shock
  hits their budget directly. (Example: a high-income but low-wealth
  persona is vulnerable to a rate spike; a low-income but high-wealth
  persona may absorb the same shock with minimal behavioral change.)
- savings_short_term: liquid cash for the next 0-12 months (emergency fund,
  near-term purchases) — highly sensitive to inflation and rate changes;
  the pool most likely to be drawn down or protected first under stress.
- savings_mid_term: earmarked for 1-5 year goals (a home deposit, a
  vehicle) — moderately sensitive; may shift between asset classes under
  macro stress, but isn't an emergency buffer.
- savings_long_term: retirement/generational wealth, 5+ years out — least
  sensitive to short-run shocks (inflation, a single rate hike), more
  sensitive to structural/long-run trends (AI-driven productivity shifts,
  demographic change). Don't let one bad quarter move this much.
- debt: total outstanding liabilities (loans, credit cards, mortgage balance).
- expense_band: a qualitative tier (lean/moderate/comfortable/high) for how
  much of income monthly_expenses already consumes — context for how much
  slack this persona has before any of today's decisions.
- monthly_expenses: recurring baseline costs (rent, bills, groceries) BEFORE
  any of the spending/saving/investing decisions you're making now.
- monthly_income: take-home pay, exactly as entered by the user — this is
  ALREADY net of income tax and all deductions. There is no tax to apply;
  use it as-is as the actual budget to allocate via your decisions (see
  budget identity below).

CRITICAL JSON RULES:
- Output ONLY a single valid JSON object. No markdown. No text before or after.
- EVERY string value MUST be wrapped in double quotes.
- summary must be ONE short sentence (under 200 characters).
- reasoning must be an array of exactly 5 quoted strings.
- All numbers must be plain numbers, not strings.

Simulation rules:
- Ground every number in the persona's traits and scenario conditions.
- decisions are monthly dollar amounts (spending, saving, borrowing, investing).
- Budget identity is mandatory: spending + saving + investing MUST equal
  monthly_income + borrowing (money in must equal money out). monthly_income
  is already take-home pay (net), exactly as the user entered it — do not
  apply any tax to it, and do not treat it as gross. Do not invent spending
  power from nowhere, and do not leave money unaccounted for.
- Let the SPLIT across savings_short_term / savings_mid_term /
  savings_long_term — not just their total — inform the saving decision: a
  persona with most savings already in savings_short_term has a buffer and
  may lean toward investing more; a persona with little savings_short_term
  but a lot in savings_long_term may prioritize rebuilding a short-term
  buffer first under a stressful scenario, even at the cost of long-term
  contributions.
- confidence values are between 0 and 1.
- behavioralTraits and theoryAlignment values are between 0 and 100.

Return JSON in exactly this shape (this is valid JSON — follow it literally):
{
  "summary": "John reduces spending to $3200 due to 7.5% inflation.",
  "decisions": { "spending": 3200, "saving": 1200, "borrowing": 200, "investing": 800 },
  "confidence": { "spending": 0.7, "saving": 0.8, "borrowing": 0.6, "investing": 0.75 },
  "behavioralTraits": { "riskTolerance": 60, "futureOrientation": 80, "impulsivity": 20, "socialConformity": 40 },
  "theoryAlignment": { "rationalChoice": 70, "behavioralEconomics": 60, "keynesianEconomics": 50, "austrianEconomics": 40 },
  "reasoning": [
    "John cuts discretionary spending because inflation erodes purchasing power.",
    "He increases saving toward his retirement goal given moderate risk appetite.",
    "He avoids new borrowing with interest rates at 8.2%.",
    "He keeps investing in a diversified portfolio despite market uncertainty.",
    "His balanced spending behavior limits impulsive financial changes."
  ]
}`

app.post('/simulate', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  const BodySchema = z.object({
    persona: z.record(z.string(), z.unknown()),
    scenario: z.record(z.string(), z.unknown()),
    persona_name: z.string().optional(),
    scenario_name: z.string().optional(),
  })
  const parsed = BodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ msg: 'persona and scenario are required' })
  }
  const { persona, scenario, persona_name = 'Unknown', scenario_name = 'Custom' } = parsed.data

  // Income is a range ($/yr) now, not one number. The budget identity below
  // (and the post-hoc rescale) needs a single anchor, so we use the
  // midpoint — but the LLM gets the full range too, for richer reasoning
  // about uncertainty ("could be anywhere from $X to $Y").
  // income_min/income_max are TAKE-HOME pay directly (see the Income comment
  // above the Phillips Curve section) — no tax step needed here.
  const incomeMin = typeof persona['income_min'] === 'number' ? (persona['income_min'] as number) : null
  const incomeMax = typeof persona['income_max'] === 'number' ? (persona['income_max'] as number) : null
  const annualIncome = incomeMin !== null && incomeMax !== null ? (incomeMin + incomeMax) / 2 : null
  const monthlyIncome = annualIncome !== null ? annualIncome / 12 : null // the rescale anchor — already net

  const personaForPrompt =
    monthlyIncome !== null
      ? {
          ...persona,
          monthly_income: Math.round(monthlyIncome * 100) / 100,
          monthly_income_range: [Math.round((incomeMin as number) / 12), Math.round((incomeMax as number) / 12)],
        }
      : persona

  // Phillips Curve: relates the scenario's own unemployment and inflation
  // inputs — independent of the persona, so it's computed once up front and
  // merged into the response/theory-alignment after the LLM call, the same
  // way the budget rescale overrides the LLM's arithmetic later.
  const scenarioUnemployment = typeof scenario['unemployment'] === 'number' ? (scenario['unemployment'] as number) : null
  const scenarioInflation = typeof scenario['inflation'] === 'number' ? (scenario['inflation'] as number) : null
  const phillipsCurve =
    scenarioUnemployment !== null && scenarioInflation !== null
      ? computePhillipsCurve(scenarioUnemployment, scenarioInflation)
      : null

  const userPrompt = `Simulate this consumer persona under this macroeconomic scenario.
Return ONLY valid JSON. Every string must use double quotes.

Persona:
${JSON.stringify(personaForPrompt, null, 2)}

Scenario:
${JSON.stringify(scenario, null, 2)}`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: process.env.GROQ_MODEL || 'groq/compound',
      temperature: 0.1,
      // The persona field definitions grew substantially (wealth's shock-
      // resilience role, three savings-horizon definitions, age brackets,
      // expense bands) — 1024 was tight enough that theoryAlignment and
      // reasoning (the last two fields in the JSON) were getting truncated
      // and silently falling back to defaults. Verified: raising this fixed it.
      max_completion_tokens: 2048,
      response_format: { type: 'json_object' },
    })

    let raw = completion.choices[0]?.message.content ?? ''
    raw = raw.trim()

    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let simulation: any
    try {
      simulation = JSON.parse(raw)
    } catch {
      // Fallback: extract the outermost JSON object
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        simulation = JSON.parse(jsonMatch[0])
      } else {
        throw new Error(`Invalid JSON returned by LLM: ${raw.slice(0, 100)}...`)
      }
    }

    // Normalize keys
    const toFiniteNumber = (value: unknown, fallback: number): number => {
      const n = Number(value)
      return Number.isFinite(n) ? n : fallback
    }

    const rawDecisions = (simulation.decisions ?? {}) as Record<string, unknown>
    let decisions = {
      spending: toFiniteNumber(rawDecisions['spending'], 3000),
      saving: toFiniteNumber(rawDecisions['saving'], 1000),
      borrowing: toFiniteNumber(rawDecisions['borrowing'], 0),
      investing: toFiniteNumber(rawDecisions['investing'], 500),
    }

    // Hard guarantee of the budget identity regardless of how well the LLM
    // honored the prompt: rescale spending/saving/investing proportionally
    // (preserving the LLM's relative emphasis) so they sum exactly to
    // monthly income + borrowing. Money in must equal money out.
    if (monthlyIncome !== null) {
      const totalOut = decisions.spending + decisions.saving + decisions.investing
      const totalIn = monthlyIncome + decisions.borrowing
      if (totalOut > 0 && totalIn > 0) {
        const scale = totalIn / totalOut
        decisions = {
          spending: Math.round(decisions.spending * scale),
          saving: Math.round(decisions.saving * scale),
          investing: Math.round(decisions.investing * scale),
          borrowing: Math.round(decisions.borrowing),
        }
      }
    }

    const llmTheoryAlignment = simulation.theoryAlignment || simulation.theory_alignment || {
      rationalChoice: 60,
      behavioralEconomics: 65,
      keynesianEconomics: 50,
      austrianEconomics: 45,
    }

    const normalized = {
      summary: simulation.summary || 'Simulation completed successfully.',
      decisions,
      confidence: simulation.confidence || { spending: 0.8, saving: 0.8, borrowing: 0.7, investing: 0.75 },
      behavioralTraits: simulation.behavioralTraits || simulation.behavioral_traits || {
        riskTolerance: 50,
        futureOrientation: 60,
        impulsivity: 30,
        socialConformity: 40,
      },
      // phillipsCurve is never left to the LLM — it's overwritten with the
      // deterministic score below, same reasoning as the budget rescale.
      theoryAlignment:
        phillipsCurve !== null
          ? { ...llmTheoryAlignment, phillipsCurve: phillipsCurve.alignment }
          : llmTheoryAlignment,
      reasoning: Array.isArray(simulation.reasoning)
        ? simulation.reasoning
        : ['The consumer adjusted financial behavior to align with economic conditions.'],
    }

    // Persist to DB — non-fatal if it fails
    try {
      await prisma.simulation.create({
        data: {
          persona_name: String(persona_name),
          scenario_name: String(scenario_name),
          summary: normalized.summary,
          decisions: normalized.decisions,
          confidence: normalized.confidence,
          behavioral_traits: normalized.behavioralTraits,
          theory_alignment: normalized.theoryAlignment,
          reasoning: normalized.reasoning,
          user_id: req.userId as string,
        },
      })
    } catch (persistErr) {
      console.error('[SIMULATE DB PERSIST ERROR]:', persistErr)
    }

    // Income figures are returned for display only (e.g. the results page's
    // "this persona's take-home pay" line) — not persisted, since the
    // Simulation table has no columns for them. monthlyIncome/annualIncome
    // are take-home pay directly, as entered — no tax figures to report.
    return res.status(200).json({
      ...normalized,
      monthlyIncome,
      annualIncome,
      annualIncomeMin: incomeMin,
      annualIncomeMax: incomeMax,
      // Phillips Curve detail — display-only, same reasoning as above, so
      // the results page can draw the scenario's point on the curve and
      // explain the gap. Not persisted (no dedicated column); the alignment
      // SCORE alone lives on in theoryAlignment.phillipsCurve, which is
      // persisted and lets analytics track it across runs.
      phillipsCurve,
    })
  } catch (error) {
    console.error('[SIMULATE ROUTE ERROR]:', error)
    return res.status(500).json({ msg: 'Simulation failed', error: String(error) })
  }
})


// (test-llm-route removed — debug endpoint not exposed in production)

// ─── User Profile ───────────────────────────────────────────────────────────

app.get('/me', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ msg: 'User not found' })
    return res.status(200).json({ user })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal server error', error: String(error) })
  }
})

app.patch('/me', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  const UpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  const parsed = UpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues })
  }
  try {
    const user = await prisma.user.update({
      where: { id: req.userId as string },
      data: parsed.data,
      select: { id: true, email: true, name: true, createdAt: true },
    })
    return res.status(200).json({ msg: 'Profile updated', user })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal server error', error: String(error) })
  }
})

// ─── Personas ───────────────────────────────────────────────────────────

app.get('/personas', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const personas = await prisma.persona.findMany({
      where: { user_id: req.userId as string },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json({ personas })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

app.post('/new-persona', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  const parsed = PersonaSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues })
  }
  try {
    // "income"/"age"/"savings" stay populated as legacy derived values for
    // any code that still expects a single number — income_min/income_max,
    // age_bracket, and the three savings horizons are the source of truth now.
    const income = (parsed.data.income_min + parsed.data.income_max) / 2
    const age = AGE_BRACKET_FLOOR[parsed.data.age_bracket]
    const savings = parsed.data.savings_short_term + parsed.data.savings_mid_term + parsed.data.savings_long_term
    const persona = await prisma.persona.create({
      data: { ...parsed.data, income, age, savings, user_id: req.userId as string },
    })
    return res.status(200).json({ msg: 'Persona creation successful.', persona })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

app.patch('/personas/:id', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  const parsed = PersonaBaseSchema.partial().refine(incomeRangeRefine, incomeRangeIssue).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues })
  }
  try {
    const personaId = req.params['id'] as string
    const existing = await prisma.persona.findUnique({ where: { id: personaId } })
    if (!existing || existing.user_id !== req.userId) {
      return res.status(404).json({ msg: 'Persona not found' })
    }
    const { income_min, income_max, age_bracket, savings_short_term, savings_mid_term, savings_long_term } = parsed.data
    const incomeUpdate =
      income_min !== undefined && income_max !== undefined
        ? { income: (income_min + income_max) / 2 }
        : {}
    const ageUpdate = age_bracket !== undefined ? { age: AGE_BRACKET_FLOOR[age_bracket] } : {}
    // Recompute the legacy sum from whichever horizons this request updates,
    // falling back to the persona's existing stored value for any horizon
    // not included in this particular partial update.
    const savingsProvided =
      savings_short_term !== undefined || savings_mid_term !== undefined || savings_long_term !== undefined
    const savingsUpdate = savingsProvided
      ? {
          savings:
            (savings_short_term ?? existing.savings_short_term ?? 0) +
            (savings_mid_term ?? existing.savings_mid_term ?? 0) +
            (savings_long_term ?? existing.savings_long_term ?? 0),
        }
      : {}
    const persona = await prisma.persona.update({
      where: { id: personaId },
      data: { ...parsed.data, ...incomeUpdate, ...ageUpdate, ...savingsUpdate },
    })
    return res.status(200).json({ msg: 'Persona updated', persona })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

app.delete('/personas/:id', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const personaId = req.params['id'] as string
    const persona = await prisma.persona.findUnique({ where: { id: personaId } })
    if (!persona || persona.user_id !== req.userId) {
      return res.status(404).json({ msg: 'Persona not found' })
    }
    await prisma.persona.delete({ where: { id: personaId } })
    return res.status(200).json({ msg: 'Persona deleted' })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

// ─── Scenarios ──────────────────────────────────────────────────────────

app.get('/scenarios', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const scenarios = await prisma.scenario.findMany({
      where: { user_id: req.userId as string },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json({ scenarios })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

app.post('/scenarios', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  const parsed = ScenarioSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues })
  }
  try {
    const scenario = await prisma.scenario.create({
      data: { ...parsed.data, user_id: req.userId as string },
    })
    return res.status(200).json({ msg: 'Scenario created', scenario })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

// ─── Simulation History ────────────────────────────────────────────────────

app.get('/simulations', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const simulations = await prisma.simulation.findMany({
      where: { user_id: req.userId as string },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return res.status(200).json({ simulations })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})


app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'EconoMind API is active' })
})

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`)
})
