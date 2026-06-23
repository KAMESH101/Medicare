// Only load .env in local development — Vercel injects env vars automatically
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin Vercel requests (no origin header) and whitelisted origins
    const allowedOrigins = [
      'https://medicare-silk-ten.vercel.app',
      'https://medicare-gamma-mauve.vercel.app',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Health check (Fast check, no DB required) ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MediCare+ API', version: '2.0.0' });
});

// ── DB middleware (connect before every database-reliant request) ─────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Server] DB connection failed:', err.message);
    return res.status(500).json({
      error: true,
      detail: 'Database connection failed. Please check server configuration.',
    });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/auth',         require('./routes/auth'));
app.use('/patients',     require('./routes/patients'));
app.use('/appointments', require('./routes/appointments'));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: true, detail: 'Resource not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.name === 'ValidationError') {
    return res.status(422).json({ error: true, detail: 'Validation error', errors: err.errors });
  }
  res.status(500).json({ error: true, detail: err.message || 'Internal server error' });
});

// ── Local dev server (not used on Vercel) ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Medicare] Server running on http://127.0.0.1:${PORT}`);
  });
}

module.exports = app;
