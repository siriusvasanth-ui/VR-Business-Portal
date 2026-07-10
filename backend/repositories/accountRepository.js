'use strict';

/**
 * Account repository (JSON implementation).
 *
 * Extends the generic JsonRepository with account-specific finders used by the
 * uniqueness checks and by authentication. A future JDBC/SQL variant simply has
 * to expose the same public methods.
 */

const JsonRepository = require('./JsonRepository');

class AccountRepository extends JsonRepository {
  constructor() {
    super('accounts.json', 'id');
  }

  /** Case-insensitive lookup by username. */
  async findByUsername(username) {
    if (!username) return null;
    const lower = String(username).toLowerCase();
    return this.findOne((a) => String(a.username).toLowerCase() === lower);
  }

  /** Lookup by employeeNumber (used for uniqueness validation). */
  async findByEmployeeNumber(employeeNumber) {
    if (!employeeNumber) return null;
    return this.findOne((a) => a.employeeNumber === employeeNumber);
  }

  /** Case-insensitive lookup by primary email. */
  async findByEmail(email) {
    if (!email) return null;
    const lower = String(email).toLowerCase();
    return this.findOne((a) => String(a.email).toLowerCase() === lower);
  }
}

module.exports = AccountRepository;
