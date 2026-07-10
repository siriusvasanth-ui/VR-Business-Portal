'use strict';

const express = require('express');
const groupService = require('../services/groupService');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { createGroup, updateGroup } = require('../validators/groupValidator');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Groups
 *     description: Group (entitlement) CRUD
 */

/**
 * @openapi
 * /api/groups:
 *   get:
 *     tags: [Groups]
 *     summary: List groups (entitlements)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: sortBy, schema: { type: string, default: id } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: Array of groups }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await groupService.getGroups(req.query);
    res.json({ success: true, data });
  })
);

/**
 * @openapi
 * /api/groups/{id}:
 *   get:
 *     tags: [Groups]
 *     summary: Get a single group
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: The group }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const group = await groupService.getGroupById(req.params.id);
    res.json({ success: true, data: group });
  })
);

/**
 * @openapi
 * /api/groups:
 *   post:
 *     tags: [Groups]
 *     summary: Create a group
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/GroupInput' } } }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Duplicate id }
 */
router.post(
  '/',
  validate(createGroup),
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const group = await groupService.createGroup(req.body, actor);
    res.status(201).json({ success: true, data: group });
  })
);

/**
 * @openapi
 * /api/groups/{id}:
 *   put:
 *     tags: [Groups]
 *     summary: Update a group
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/GroupInput' } } }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
router.put(
  '/:id',
  validate(updateGroup),
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const group = await groupService.updateGroup(req.params.id, req.body, actor);
    res.json({ success: true, data: group });
  })
);

/**
 * @openapi
 * /api/groups/{id}:
 *   delete:
 *     tags: [Groups]
 *     summary: Delete a group (refused if still assigned)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       409: { description: Still assigned to accounts }
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const actor = req.user ? req.user.username : 'system';
    const result = await groupService.deleteGroup(req.params.id, actor);
    res.json({ success: true, data: result });
  })
);

module.exports = router;
