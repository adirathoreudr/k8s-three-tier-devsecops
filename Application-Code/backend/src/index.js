const app = require('./app');

const PORT = process.env.PORT || 3500;

const server = app.listen(PORT, () => {
  console.log(`[Backend] Server running on port ${PORT}`);
  console.log(`[Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;
