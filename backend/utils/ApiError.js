'use strict';

/**
 * Application error carrying an HTTP status code and an optional list of
 * field-level validation details. Thrown from the service layer and translated
 * into a JSON response by the central error handler.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} message     human-readable message
   * @param {Array}  [details]   optional field-level error details
   */
  constructor(statusCode, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = []) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
