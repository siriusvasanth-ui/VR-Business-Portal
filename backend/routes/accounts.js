'use strict';

const express = require('express');
const accountService = require('../services/accountService');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { createAccount, updateAccount, assignGroup } = require('../validators/accountValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Accounts
 *     description: Account CRUD and group-assignment operations
 *   - name: Dashboard
 *     description: Aggregate metrics
 */

/**
 * @openapi
 * /api/accounts/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Dashboard statistics (totals + breakdowns)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Aggregate counts for cards and charts }
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await accountService.getDashboardStats() });
  })
);

/**
 * @openapi
 * /api/accounts:
 *   get:
 *     tags: [Accounts]
 *     summary: List accounts with pagination, search, filtering and sorting
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: search, schema: { type: string }, description: Free-text across username/name/email/employeeNumber }
 *       - { in: query, name: department, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, inactive] } }
 *       - { in: query, name: region, schema: { type: string } }
 *       - { in: query, name: accountType, schema: { type: string } }
 *       - { in: query, name: locked, schema: { type: boolean } }
 *       - { in: query, name: sortBy, schema: { type: string, default: displayName } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc], default: asc } }
 *     responses:
 *       200: { description: Paginated list of accounts }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await accountService.getAccounts(req.query);
    res.json({ success: true, ...result });
  })
);

/**
 * @openapi
 * /api/accounts/{id}:
 *   get:
 *     tags: [Accounts]
 *     summary: Get a single account by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The account }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const account = await accountService.getAccountById(req.params.id);
    res.json({ success: true, data: account });
  })
);

/**
 * @openapi
 * /api/accounts:
 *   post:
 *     tags: [Accounts]
 *     summary: Create an account
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/AccountInput' } } }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation failed }
 *       409: { description: Duplicate username/employeeNumber/email }
 */
router.post(
  '/',
  validate(createAccount),
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const account = await accountService.createAccount(req.body, actor);
    res.status(201).json({ success: true, data: account });
  })
);

/**
 * @openapi
 * /api/accounts/{id}:
 *   put:
 *     tags: [Accounts]
 *     summary: Update an account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/AccountInput' } } }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       409: { description: Duplicate value }
 */
router.put(
  '/:id',
  validate(updateAccount),
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const account = await accountService.updateAccount(req.params.id, req.body, actor);
    res.json({ success: true, data: account });
  })
);

/**
 * @openapi
 * /api/accounts/{id}:
 *   delete:
 *     tags: [Accounts]
 *     summary: Delete an account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const result = await accountService.deleteAccount(req.params.id, actor);
    res.json({ success: true, data: result });
  })
);

// ---------------------------------------------------------------------------
// Group assignment sub-resource
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/accounts/{id}/groups:
 *   get:
 *     tags: [Accounts]
 *     summary: List the groups (entitlements) assigned to an account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Array of group objects }
 *       404: { description: Account not found }
 */
router.get(
  '/:id/groups',
  asyncHandler(async (req, res) => {
    const groups = await accountService.getAccountGroups(req.params.id);
    res.json({ success: true, data: groups });
  })
);

/**
 * @openapi
 * /api/accounts/{id}/groups:
 *   post:
 *     tags: [Accounts]
 *     summary: Assign one or more groups (entitlements) to an account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groups]
 *             properties:
 *               groups:
 *                 type: array
 *                 items: { type: string }
 *                 example: [WS-ENT200, WS-ENT300]
 *     responses:
 *       200: { description: Updated account }
 *       400: { description: Group does not exist }
 *       409: { description: Group(s) already assigned }
 */
router.post(
  '/:id/groups',
  validate(assignGroup),
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const groupIds = req.body.groups;
    const account = await accountService.assignGroups(req.params.id, groupIds, actor);
    res.json({ success: true, data: account });
  })
);

/**
 * @openapi
 * /api/accounts/{id}/groups/{groupId}:
 *   delete:
 *     tags: [Accounts]
 *     summary: Remove a group (entitlement) from an account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: groupId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated account }
 *       404: { description: Account or assignment not found }
 */
router.delete(
  '/:id/groups/:groupId',
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const account = await accountService.removeGroup(req.params.id, req.params.groupId, actor);
    res.json({ success: true, data: account });
  })
);

module.exports = router;
