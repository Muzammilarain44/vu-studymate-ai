import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const { MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN = 'http://localhost:5173' } = process.env;
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('Configure MONGODB_URI and JWT_SECRET (32+ characters) in server/.env');
  process.exit(1);
}
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN.split(',').map(s => s.trim()) }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
const packSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: String, required: true, maxlength: 50 },
  title: { type: String, required: true, maxlength: 200 },
  summary: String,
  takeaways: [String],
  concepts: [mongoose.Schema.Types.Mixed],
  questions: [mongoose.Schema.Types.Mixed],
  mode: { type: String, enum: ['demo', 'ai'], default: 'demo' }
}, { timestamps: true });
const StudyPack = mongoose.model('StudyPack', packSchema);
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const credentials = z.object({ email: z.string().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(8).max(128) });
const signToken = user => jwt.sign({ sub: String(user._id) }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
function requireAuth(req, res, next) {
  try {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    req.userId = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }).sub;
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const parsed = credentials.extend({ name: z.string().trim().min(1).max(80) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid registration data' });
  const { name, email, password } = parsed.data;
  if (await User.exists({ email })) return res.status(409).json({ error: 'Email already registered' });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: signToken(user), user: { id: user.id, name, email } });
}));
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' });
  const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email } });
}));
app.get('/api/auth/me', requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.userId).select('name email');
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}));
app.get('/api/study-packs', requireAuth, asyncRoute(async (req, res) => {
  const packs = await StudyPack.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ packs });
}));
const studyPackInput = z.object({
  course: z.string().trim().min(1).max(50), title: z.string().trim().min(1).max(200),
  summary: z.string().max(15000).default(''),
  takeaways: z.array(z.string().max(1000)).max(30).default([]),
  concepts: z.array(z.object({ title: z.string(), explanation: z.string(), importance: z.string(), sourceQuote: z.string() })).max(30).default([]),
  questions: z.array(z.object({ question: z.string(), options: z.tuple([z.string(), z.string(), z.string(), z.string()]), correctIndex: z.number().int().min(0).max(3), explanation: z.string(), sourceQuote: z.string() })).max(50).default([]),
  mode: z.enum(['demo', 'ai']).default('demo')
});
app.post('/api/study-packs', requireAuth, asyncRoute(async (req, res) => {
  const parsed = studyPackInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid study pack data' });
  const pack = await StudyPack.create({ ...parsed.data, user: req.userId });
  res.status(201).json({ pack });
}));
app.delete('/api/study-packs/:id', requireAuth, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
  const deleted = await StudyPack.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));
app.use((err, _req, res, _next) => {
  if (err?.code === 11000) return res.status(409).json({ error: 'Email already registered' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  app.listen(Number(process.env.PORT || 4000), () => console.log('VU StudyMate API started'));
} catch (error) { console.error('MongoDB connection failed:', error.message); process.exit(1); }
