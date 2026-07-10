'use strict';

/** express-validator chains for group (entitlement) endpoints. */

const { body, param } = require('express-validator');

const createGroup = [
  body('id')
    .exists({ checkFalsy: true }).withMessage('id is required')
    .isString().trim()
    .matches(/^[A-Za-z0-9._-]+$/).withMessage('id may contain letters, digits, dot, dash and underscore only'),
  body('name')
    .exists({ checkFalsy: true }).withMessage('name is required')
    .isString().trim(),
  body('description').optional().isString(),
  body('displayName').optional().isString()
];

const updateGroup = [
  param('id').exists().withMessage('id param is required'),
  body('name').optional().isString().trim(),
  body('description').optional().isString(),
  body('displayName').optional().isString()
];

module.exports = { createGroup, updateGroup };
