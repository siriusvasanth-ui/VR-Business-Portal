'use strict';

const express = require('express');
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate a user and receive a JWT
 *     description: >
 *       Local authentication where each user's password is identical to their
 *       username. Returns a signed JWT to be sent as `Authorization: Bearer`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: vasanth_ram }
 *               password: { type: string, example: vasanth_ram }
 *     responses:
 *       200:
 *         description: Authentication succeeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 token:   { type: string, example: "eyJhbGciOi..." }
 *                 user:    { type: object }
 *       400: { description: Missing credentials }
 *       401: { description: Invalid username or password }
 *       403: { description: Account locked or inactive }
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    const result = await authService.login(username, password);
    res.json(result);
  })
);

module.exports = router;
