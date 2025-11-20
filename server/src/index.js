import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './auth.routes.js';
import itemRoutes from './items.routes.js';
import { query } from './db.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');

// Enable gzip compression for all responses
app.use(compression());

const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true); // allow curl/postman
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: false
}));

app.use(express.json({ limit: '1mb' }));

// Security and performance headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.removeHeader('X-Powered-By');
  next();
});

app.get('/healthz', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.set('Cache-Control','no-store');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// Alternate health route for external probes expecting /health
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.set('Cache-Control','no-store');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use('/auth', authRoutes);
app.use('/items', itemRoutes);

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
