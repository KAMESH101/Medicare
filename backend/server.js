require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB and seed if database is empty
connectDB();

// CORS configuration (allow ports used by frontend + Vercel production)
const allowedOrigins = [
  'https://medicare-gamma-mauve.vercel.app', // Vercel production
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Body parser
app.use(express.json());

// Expose health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MediCare+ API',
    version: '1.0.0',
  });
});

// Mount routers
app.use('/auth', require('./routes/auth'));
app.use('/patients', require('./routes/patients'));
app.use('/appointments', require('./routes/appointments'));

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: true,
    detail: 'Resource not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error] Global handler caught:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: true,
      detail: 'Validation error',
      errors: err.errors,
    });
  }

  res.status(500).json({
    error: true,
    detail: err.message || 'Internal server error',
  });
});

// Start Express server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Medicare] Server is running on http://127.0.0.1:${PORT}`);
  });
}

module.exports = app;
