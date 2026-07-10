'use strict';

/**
 * Centralised configuration.
 *
 * Every environment-specific value is read here once and exported as a plain
 * object. Nothing else in the code base should read `process.env` directly, so
 * that swapping a deployment target (local, Render, container) only touches
 * this file and the `.env`.
 */

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Comma-separated list of allowed origins for CORS. "*" allows all.
  corsOrigin: process.env.CORS_ORIGIN || '*',

  jwt: {
    secret: process.env.JWT_SECRET || 'vr-business-portal-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: process.env.JWT_ISSUER || 'vr-business-portal'
  },

  /**
   * Selects which repository implementation the factory wires up.
   * Today only "json" is implemented; "jdbc" | "mysql" | "postgres" are the
   * planned future targets (see docs/JDBC_MIGRATION.md).
   */
  repository: {
    type: process.env.REPOSITORY_TYPE || 'json'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
