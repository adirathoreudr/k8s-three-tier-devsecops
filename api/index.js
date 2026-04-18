// Vercel Serverless Function — handles all /api/* routes
// Same Express app as the backend, adapted for serverless
const app = require('../Application-Code/backend/src/app');

module.exports = app;
