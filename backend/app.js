'use strict';

/**
 * VR Business Portal — Express application entry point.
 *
 * Wires up middleware, Swagger, the auth/accounts/groups routers and the
 * central error handler. All protected routes sit behind JWT auth; /api/auth
 * and the docs/health endpoints are public.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const logger = require('./config/logger');
const { mountSwagger } = require('./swagger');
const authMiddleware = require('./middleware/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const groupRoutes = require('./routes/groups');

const app = express();

// ---- Global middleware ----
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((o) => o.trim())
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight request logger.
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});

// ---- Health & docs (public) ----
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'vr-business-portal', repository: config.repository.type })
);
mountSwagger(app);

// ---- API routes ----
app.use('/api/auth', authRoutes);
// Everything below requires a valid JWT.
app.use('/api/accounts', authMiddleware, accountRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);

// ---- Optional: serve the built frontend when present (single-service deploy) ----
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get(/^\/(?!api|api-docs|health).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(); // dist not built — fall through to 404 handler
  });
});

// ---- Error handling ----
app.use(notFoundHandler);
app.use(errorHandler);

// ---- Start ----
if (require.main === module) {
  app.listen(config.port, () => {
    logger.info(`VR Business Portal API listening on port ${config.port} (${config.env})`);
    logger.info(`Swagger UI:  http://localhost:${config.port}/api-docs`);
  });
}

module.exports = app;
