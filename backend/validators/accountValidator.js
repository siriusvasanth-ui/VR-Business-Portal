'use strict';

/**
 * express-validator chains for account endpoints.
 * Service-layer uniqueness checks (username/employeeNumber/email/group ids)
 * complement these shape/format validations.
 */

const { body, param } = require('express-validator');

const createAccount = [
  body('username')
    .exists({ checkFalsy: true }).withMessage('username is required')
    .isString().withMessage('username must be a string')
    .trim(),
  body('firstName')
    .exists({ checkFalsy: true }).withMessage('firstName is required')
    .isString().trim(),
  body('lastName')
    .exists({ checkFalsy: true }).withMessage('lastName is required')
    .isString().trim(),
  body('email')
    .exists({ checkFalsy: true }).withMessage('email is required')
    .isEmail().withMessage('email must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('secondaryEmail')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('secondaryEmail must be a valid email address'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage("status must be 'active' or 'inactive'"),
  body('locked')
    .optional()
    .isBoolean().withMessage('locked must be a boolean'),
  body('groups')
    .optional()
    .isArray().withMessage('groups must be an array of group ids')
];

const updateAccount = [
  param('id').exists().withMessage('id param is required'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('email must be a valid email address'),
  body('secondaryEmail')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('secondaryEmail must be a valid email address'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage("status must be 'active' or 'inactive'"),
  body('locked')
    .optional()
    .isBoolean().withMessage('locked must be a boolean'),
  body('groups')
    .optional()
    .isArray().withMessage('groups must be an array of group ids')
];

const assignGroup = [
  param('id').exists().withMessage('id param is required'),
  body('groups')
    .exists().withMessage('groups is required')
    .isArray({ min: 1 }).withMessage('groups must be a non-empty array of group ids'),
  body('groups.*')
    .isString().withMessage('each group id in groups must be a string')
    .trim()
    .notEmpty().withMessage('group id cannot be empty'),
  body('groupId')
    .optional({ checkFalsy: true })
    .isString().withMessage('groupId must be a string')
    .trim(),
  body().custom((value) => {
    if (!value || !Array.isArray(value.groups) || value.groups.length === 0) {
      throw new Error('groups array is required');
    }
    return true;
  })
];

module.exports = { createAccount, updateAccount, assignGroup };
