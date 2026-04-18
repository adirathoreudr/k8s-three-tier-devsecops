const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend-api',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.MONGO_URI ? 'configured' : 'not-configured',
  });
});

router.get('/ready', (req, res) => {
  // Readiness probe: check if app is ready to accept traffic
  res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
});

module.exports = router;
