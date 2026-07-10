'use strict';

/**
 * Authentication service.
 *
 * Authentication is deliberately isolated behind a single `authenticate`
 * function (the "identity provider" seam). Today it validates local credentials
 * where each user's password equals their username. To move to Microsoft Entra
 * ID / SAML / OIDC / OAuth2 later, only `authenticateCredentials` (and token
 * verification) need to change — routes, services and the UI stay the same.
 */

const jwt = require('jsonwebtoken');
const { accountRepository } = require('../repositories');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

/**
 * ---- IDENTITY PROVIDER SEAM ----
 * Validate a username/password pair and return the matching account.
 * Replace the body of this function to integrate an external IdP.
 */
async function authenticateCredentials(username, password) {
  const account = await accountRepository.findByUsername(username);
  if (!account) {
    throw ApiError.unauthorized('Invalid username or password');
  }
  if (account.locked) {
    throw ApiError.forbidden('Account is locked');
  }
  if (account.status !== 'active') {
    throw ApiError.forbidden('Account is not active');
  }
  // Local credential check — password is identical to the username.
  const expected = account.password || account.username;
  if (password !== expected) {
    throw ApiError.unauthorized('Invalid username or password');
  }
  return account;
}

/** Build the signed JWT for an authenticated account. */
function issueToken(account) {
  const payload = {
    sub: account.id,
    username: account.username,
    displayName: account.displayName,
    accountType: account.accountType
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer
  });
}

class AuthService {
  /**
   * Perform a login.
   * @returns {Promise<{success:boolean, token:string, user:object}>}
   */
  async login(username, password) {
    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const account = await authenticateCredentials(username, password);
    const token = issueToken(account);

    logger.audit('LOGIN', `Successful login: ${account.username}`, {
      actor: account.username,
      targetId: account.id
    });

    return {
      success: true,
      token,
      user: {
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        email: account.email,
        accountType: account.accountType
      }
    };
  }

  /** Verify a bearer token and return its decoded payload (throws on failure). */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
