'use strict';

/**
 * JWT authentication middleware.
 *
 * Expects an `Authorization: Bearer <token>` header. On success, attaches the
 * decoded token payload to `req.user` and continues; otherwise responds 401.
 * Kept independent of the auth mechanism by delegating verification to the
 * authService seam.
 */

const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');

module.exports = function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    req.user = authService.verifyToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
};
