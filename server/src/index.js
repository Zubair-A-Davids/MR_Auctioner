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

// Development CORS settings - allow all origins in development
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment 
  ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'] 
  : (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: function (origin, cb) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return cb(null, true);
    
    // Check against allowed origins
    if (isDevelopment || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    
    // Origin not allowed
    console.log(`CORS blocked for origin: ${origin}`);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
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
