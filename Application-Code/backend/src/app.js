const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const taskRoutes = require('./routes/tasks');
const healthRoutes = require('./routes/health');

const app = express();

// ── Security middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Logging ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Body parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Routes ─────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/api/tasks', taskRoutes);

// ── 404 handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ── Global error handler ───────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
