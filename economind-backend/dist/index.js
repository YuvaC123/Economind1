import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Groq } from 'groq-sdk';
import { z } from 'zod';
import { authMiddleware } from './middleware/auth.js';
const app = express();
// ─── CORS ─────────────────────────────────────────────────────────────────────
// ─── CORS ─────────────────────────────────────────────────────────────────────
const configuredOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, ''))
    : [];
const allowedOrigins = Array.from(new Set(['http://localhost:3000', 'http://localhost:3001', ...configuredOrigins]));
app.use(cors({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
            return cb(null, true);
        }
        cb(new Error(`CORS: origin '${origin}' not allowed`), false);
    },
    credentials: true,
}));
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
import { sendOtpEmail } from './lib/mailer.js';
// ─── Zod Schemas ───────────────────────────────────────────────────────────
const SendOtpSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(50, 'Name must not exceed 50 characters'),
    email: z.string().trim().email('Invalid email address').max(100, 'Email must not exceed 100 characters'),
    password: z.string().min(6, 'Password must be between 6 and 64 characters').max(64, 'Password must not exceed 64 characters'),
});
const SigninSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(100, 'Email must not exceed 100 characters'),
    password: z.string().min(1, 'Password is required').max(64, 'Password must not exceed 64 characters'),
});
const VerifyOtpSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(100),
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
});
const ResendOtpSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(100),
});
const otpStore = new Map();
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
});
const ScenarioSchema = z.object({
    scenario_name: z.string().min(1),
    inflation_rate: z.number(),
    interest_rate: z.number(),
    unemployment_rate: z.number(),
    market_volatility: z.number(),
});
//health check route
app.get("/health", async (req, res) => {
    return res.status(202).json({ 'msg': "Server is up and healthy" });
});
// ─── OTP Based Signup: Step 1 - Send OTP ─────────────────────────────────────
app.post("/send-otp", async (req, res) => {
    const parseResult = SendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            msg: parseResult.error.issues[0]?.message ?? "Invalid input"
        });
    }
    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    try {
        // Check if email is already registered
        try {
            const existingUser = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });
            if (existingUser) {
                return res.status(409).json({
                    msg: "An account with this email already exists. Please log in."
                });
            }
        }
        catch (dbErr) {
            console.warn("DB check bypassed:", dbErr instanceof Error ? dbErr.message : dbErr);
        }
        // Generate 6-digit OTP and hash password
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        // Save to in-memory store
        otpStore.set(normalizedEmail, {
            otp,
            name: name.trim(),
            hashedPassword,
            expiresAt,
        });
        // Also persist to DB if connected
        try {
            await prisma.otpVerification?.upsert({
                where: { email: normalizedEmail },
                update: {
                    otp,
                    name: name.trim(),
                    password: hashedPassword,
                    expiresAt: new Date(expiresAt),
                },
                create: {
                    email: normalizedEmail,
                    name: name.trim(),
                    otp,
                    password: hashedPassword,
                    expiresAt: new Date(expiresAt),
                }
            });
        }
        catch (dbErr) {
            // Memory store will handle it safely
        }
        // Dispatch email in background (non-blocking for instant client response)
        sendOtpEmail({
            email: normalizedEmail,
            name: name.trim(),
            otp,
        }).catch((emailErr) => {
            console.error("Async sendOtpEmail error:", emailErr);
        });
        return res.status(200).json({
            msg: "Verification code is being sent to your email",
            email: normalizedEmail,
            expiresInSeconds: 600,
        });
    }
    catch (error) {
        console.error("send-otp error:", error);
        return res.status(500).json({ msg: "Failed to process signup request", error });
    }
});
// ─── OTP Based Signup: Resend OTP ───────────────────────────────────────────
app.post("/resend-otp", async (req, res) => {
    const parseResult = ResendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ msg: "Valid email is required" });
    }
    const normalizedEmail = parseResult.data.email.trim().toLowerCase();
    const existing = otpStore.get(normalizedEmail);
    if (!existing) {
        return res.status(400).json({
            msg: "No pending signup found for this email. Please restart signup."
        });
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    existing.otp = newOtp;
    existing.expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(normalizedEmail, existing);
    // Dispatch email in background
    sendOtpEmail({
        email: normalizedEmail,
        name: existing.name,
        otp: newOtp,
    }).catch((emailErr) => {
        console.error("Async resend sendOtpEmail error:", emailErr);
    });
    return res.status(200).json({
        msg: "New verification code sent",
        email: normalizedEmail,
        expiresInSeconds: 600,
    });
});
// ─── OTP Based Signup: Step 2 - Verify OTP & Create Account ─────────────────
app.post("/verify-otp", async (req, res) => {
    const parseResult = VerifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            msg: parseResult.error.issues[0]?.message ?? "Invalid OTP format"
        });
    }
    const { email, otp } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    let record = otpStore.get(normalizedEmail);
    // Check DB if not in memory
    if (!record) {
        try {
            const dbRecord = await prisma.otpVerification?.findUnique({
                where: { email: normalizedEmail }
            });
            if (dbRecord) {
                record = {
                    otp: dbRecord.otp,
                    name: dbRecord.name,
                    hashedPassword: dbRecord.password,
                    expiresAt: new Date(dbRecord.expiresAt).getTime(),
                };
            }
        }
        catch (dbErr) {
            // ignore
        }
    }
    if (!record) {
        return res.status(400).json({
            msg: "Verification code expired or not found. Please request a new code."
        });
    }
    if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({
            msg: "Verification code has expired. Please request a new code."
        });
    }
    if (record.otp !== otp.trim()) {
        return res.status(400).json({
            msg: "Incorrect verification code. Please check and try again."
        });
    }
    // OTP is valid! Create the user in database
    try {
        let user;
        try {
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: record.name,
                    password: record.hashedPassword,
                }
            });
            // Clean up DB verification record
            await prisma.otpVerification?.deleteMany({
                where: { email: normalizedEmail }
            }).catch(() => { });
        }
        catch (dbErr) {
            // Fallback user object if DB offline
            user = {
                id: `usr_${Date.now()}`,
                email: normalizedEmail,
                name: record.name,
            };
        }
        // Clean up memory store
        otpStore.delete(normalizedEmail);
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '48h' });
        return res.status(201).json({
            msg: "Account verified and created successfully",
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    }
    catch (error) {
        console.error("verify-otp error:", error);
        return res.status(500).json({ msg: "Failed to create account", error });
    }
});
// ─── Signin Route (for existing accounts) ────────────────────────────────────
app.post("/signin", async (req, res) => {
    const parseResult = SigninSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            msg: parseResult.error.issues[0]?.message ?? "Invalid credentials"
        });
    }
    const { email, password } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    try {
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });
        if (!user) {
            return res.status(404).json({ msg: "No account found with this email. Please sign up." });
        }
        const checkPassword = await bcrypt.compare(password, user.password);
        if (checkPassword) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '48h' });
            return res.status(200).json({
                msg: "Signin successful",
                token,
                user: { id: user.id, email: user.email, name: user.name }
            });
        }
        return res.status(401).json({ msg: "Password is incorrect" });
    }
    catch (error) {
        return res.status(500).json({ msg: "Internal server error", error });
    }
});
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
}`;
app.post('/simulate', authMiddleware, async (req, res) => {
    const BodySchema = z.object({
        persona: z.record(z.string(), z.unknown()),
        scenario: z.record(z.string(), z.unknown()),
        persona_name: z.string().optional(),
        scenario_name: z.string().optional(),
    });
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'persona and scenario are required' });
    }
    const { persona, scenario, persona_name = 'Unknown', scenario_name = 'Custom' } = parsed.data;
    const userPrompt = `Simulate this consumer persona under this macroeconomic scenario.
Return ONLY valid JSON. Every string must use double quotes.

Persona:
${JSON.stringify(persona, null, 2)}

Scenario:
${JSON.stringify(scenario, null, 2)}`;
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
        });
        let raw = completion.choices[0]?.message.content ?? '';
        raw = raw.trim();
        // Strip markdown code fences if present
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        let simulation;
        try {
            simulation = JSON.parse(raw);
        }
        catch {
            // Fallback: extract the outermost JSON object
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                simulation = JSON.parse(jsonMatch[0]);
            }
            else {
                throw new Error(`Invalid JSON returned by LLM: ${raw.slice(0, 100)}...`);
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
        };
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
                    user_id: req.userId,
                },
            });
        }
        catch (persistErr) {
            console.error('[SIMULATE DB PERSIST ERROR]:', persistErr);
        }
        return res.status(200).json(normalized);
    }
    catch (error) {
        console.error('[SIMULATE ROUTE ERROR]:', error);
        return res.status(500).json({ msg: 'Simulation failed', error: String(error) });
    }
});
// (test-llm-route removed — debug endpoint not exposed in production)
// ─── User Profile ───────────────────────────────────────────────────────────
app.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, name: true, createdAt: true },
        });
        if (!user)
            return res.status(404).json({ msg: 'User not found' });
        return res.status(200).json({ user });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal server error', error: String(error) });
    }
});
app.patch('/me', authMiddleware, async (req, res) => {
    const UpdateSchema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
    });
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues });
    }
    try {
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: parsed.data,
            select: { id: true, email: true, name: true, createdAt: true },
        });
        return res.status(200).json({ msg: 'Profile updated', user });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal server error', error: String(error) });
    }
});
// ─── Personas ───────────────────────────────────────────────────────────
app.get('/personas', authMiddleware, async (req, res) => {
    try {
        const personas = await prisma.persona.findMany({
            where: { user_id: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ personas });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
app.post('/new-persona', authMiddleware, async (req, res) => {
    const parsed = PersonaSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues });
    }
    try {
        const persona = await prisma.persona.create({
            data: { ...parsed.data, user_id: req.userId },
        });
        return res.status(200).json({ msg: 'Persona creation successful.', persona });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
app.patch('/personas/:id', authMiddleware, async (req, res) => {
    const parsed = PersonaSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues });
    }
    try {
        const personaId = req.params['id'];
        const existing = await prisma.persona.findUnique({ where: { id: personaId } });
        if (!existing || existing.user_id !== req.userId) {
            return res.status(404).json({ msg: 'Persona not found' });
        }
        const persona = await prisma.persona.update({
            where: { id: personaId },
            data: parsed.data,
        });
        return res.status(200).json({ msg: 'Persona updated', persona });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
app.delete('/personas/:id', authMiddleware, async (req, res) => {
    try {
        const personaId = req.params['id'];
        const persona = await prisma.persona.findUnique({ where: { id: personaId } });
        if (!persona || persona.user_id !== req.userId) {
            return res.status(404).json({ msg: 'Persona not found' });
        }
        await prisma.persona.delete({ where: { id: personaId } });
        return res.status(200).json({ msg: 'Persona deleted' });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
// ─── Scenarios ──────────────────────────────────────────────────────────
app.get('/scenarios', authMiddleware, async (req, res) => {
    try {
        const scenarios = await prisma.scenario.findMany({
            where: { user_id: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ scenarios });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
app.post('/scenarios', authMiddleware, async (req, res) => {
    const parsed = ScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Validation failed', errors: parsed.error.issues });
    }
    try {
        const scenario = await prisma.scenario.create({
            data: { ...parsed.data, user_id: req.userId },
        });
        return res.status(200).json({ msg: 'Scenario created', scenario });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
// ─── Simulation History ────────────────────────────────────────────────────
app.get('/simulations', authMiddleware, async (req, res) => {
    try {
        const simulations = await prisma.simulation.findMany({
            where: { user_id: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return res.status(200).json({ simulations });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Internal Server Error', error: String(error) });
    }
});
// ─── Health Check & Root Route for Render ──────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'EconoMind API is active' });
});
// ─── Start with Dynamic Port & 0.0.0.0 Binding ─────────────────────────────
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
// ─── Start ─────────────────────────────────────────────────────────────────
//# sourceMappingURL=index.js.map