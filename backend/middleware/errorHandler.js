'use strict';

/**
 * Central error-handling middleware and 404 handler.
 * Translates thrown ApiError instances (and unexpected errors) into a
 * consistent JSON error envelope, and logs server-side failures.
 */

const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

/** 404 handler for unknown routes. */
function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Final error handler. Must keep the 4-argument signature for Express. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message: err.message || 'Internal Server Error',
      details: err.details || []
    }
  });
}

module.exports = { notFoundHandler, errorHandler };
