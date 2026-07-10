'use strict';

/**
 * express-validator result collector.
 *
 * Runs the array of validation chains supplied by a validator module, then
 * short-circuits with a 400 (and structured field details) if any failed.
 */

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const details = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg
    }));
    return next(ApiError.badRequest('Validation failed', details));
  };
};
