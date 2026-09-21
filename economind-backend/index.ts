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

const PersonaSchema = z.object({
  name: z.string().trim().min(1, 'Persona name is required').max(50, 'Persona name must not exceed 50 characters'),
  age: z.number().int('Age must be a whole number').min(1, 'Age must be at least 1').max(120, 'Age cannot exceed 120'),
  gender: z.string().trim().max(30).optional().nullable(),
  education: z.string().trim().max(50).optional().nullable(),
  income: z.number().min(0, 'Income cannot be negative').max(100_000_000, 'Income exceeds maximum limit ($100M)'),
  savings: z.number().min(0, 'Savings cannot be negative').max(100_000_000, 'Savings exceeds maximum limit ($100M)'),
  monthly_expenses: z.number().min(0, 'Monthly expenses cannot be negative').max(10_000_000, 'Monthly expenses exceeds limit ($10M)'),
  wealth: z.number().min(-10_000_000, 'Wealth is below minimum limit').max(1_000_000_000, 'Wealth exceeds limit ($1B)'),
  debt: z.number().min(0, 'Debt cannot be negative').max(100_000_000, 'Debt exceeds maximum limit ($100M)'),
  risk_appetite: z.string().min(1, 'Risk appetite is required').max(30),
  spending_behavior: z.string().trim().max(30).optional().nullable(),
  saving_preference: z.string().trim().max(30).optional().nullable(),
  investment_preference: z.string().trim().max(30).optional().nullable(),
})

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
const systemPrompt = `You are EconoMind's behavioral simulation engine.

Given a consumer persona and macroeconomic scenario, simulate how that persona would behave financially.

CRITICAL JSON RULES:
- Output ONLY a single valid JSON object. No markdown. No text before or after.
- EVERY string value MUST be wrapped in double quotes.
- summary must be ONE short sentence (under 200 characters).
- reasoning must be an array of exactly 5 quoted strings.
- All numbers must be plain numbers, not strings.

Simulation rules:
- Ground every number in the persona's traits and scenario conditions.
- decisions are monthly dollar amounts (spending, saving, borrowing, investing).
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

  const userPrompt = `Simulate this consumer persona under this macroeconomic scenario.
Return ONLY valid JSON. Every string must use double quotes.

Persona:
${JSON.stringify(persona, null, 2)}

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
      max_completion_tokens: 1024,
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
    const normalized = {
      summary: simulation.summary || 'Simulation completed successfully.',
      decisions: simulation.decisions || { spending: 3000, saving: 1000, borrowing: 0, investing: 500 },
      confidence: simulation.confidence || { spending: 0.8, saving: 0.8, borrowing: 0.7, investing: 0.75 },
      behavioralTraits: simulation.behavioralTraits || simulation.behavioral_traits || {
        riskTolerance: 50,
        futureOrientation: 60,
        impulsivity: 30,
        socialConformity: 40,
      },
      theoryAlignment: simulation.theoryAlignment || simulation.theory_alignment || {
        rationalChoice: 60,
        behavioralEconomics: 65,
        keynesianEconomics: 50,
        austrianEconomics: 45,
      },
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

    return res.status(200).json(normalized)
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
    const persona = await prisma.persona.create({
      data: { ...parsed.data, user_id: req.userId as string },
    })
    return res.status(200).json({ msg: 'Persona creation successful.', persona })
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error', error: String(error) })
  }
})

app.patch('/personas/:id', authMiddleware, async (req: AuthedRequest, res: Response): Promise<any> => {
  const parsed = PersonaSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues })
  }
  try {
    const personaId = req.params['id'] as string
    const existing = await prisma.persona.findUnique({ where: { id: personaId } })
    if (!existing || existing.user_id !== req.userId) {
      return res.status(404).json({ msg: 'Persona not found' })
    }
    const persona = await prisma.persona.update({
      where: { id: personaId },
      data: parsed.data,
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
