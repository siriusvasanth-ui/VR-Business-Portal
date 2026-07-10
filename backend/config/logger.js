'use strict';

/**
 * Winston logger.
 *
 * Writes structured JSON to backend/logs/application.log and human-readable,
 * colourised output to the console. A dedicated `audit` helper is exposed for
 * the security-relevant events the specification requires us to record
 * (logins, account/group mutations and group assignments).
 */

const path = require('path');
const fs = require('fs');
const winston = require('winston');
const config = require('./config');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vr-business-portal' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'application.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Console transport (pretty) — kept off in production log files.
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, event }) => {
        const tag = event ? ` [${event}]` : '';
        return `${timestamp} ${level}:${tag} ${message}`;
      })
    )
  })
);

/**
 * Audit helper — records a named domain event with structured metadata.
 * @param {string} event  e.g. LOGIN, ACCOUNT_CREATE, GROUP_ASSIGN
 * @param {string} message  human-readable summary
 * @param {object} [meta]  additional structured context (actor, target, ...)
 */
logger.audit = (event, message, meta = {}) => {
  logger.info(message, { event, ...meta });
};

module.exports = logger;
