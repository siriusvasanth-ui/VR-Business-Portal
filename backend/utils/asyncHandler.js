'use strict';

/**
 * Wraps an async Express route handler so that any rejected promise is
 * forwarded to the central error-handling middleware instead of crashing the
 * request. Removes the need for a try/catch in every controller.
 *
 * @param {Function} fn  async (req, res, next) => {...}
 * @returns {Function}   Express-compatible handler
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
