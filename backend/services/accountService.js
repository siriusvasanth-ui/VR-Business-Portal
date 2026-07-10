'use strict';

/**
 * Account service — all account & group-assignment business logic.
 *
 * Talks to the repository layer through the factory (repositories/index.js) and
 * NEVER touches JSON files directly. Enforces uniqueness rules, referential
 * integrity for group ids, pagination/search/filter/sort, and emits audit logs.
 */

const { accountRepository, groupRepository } = require('../repositories');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/** Fields a client may search across with the free-text `search` param. */
const SEARCHABLE_FIELDS = [
  'username',
  'displayName',
  'name',
  'email',
  'employeeNumber',
  'firstName',
  'lastName',
  'department'
];

/** Fields a client may filter on via exact match query params. */
const FILTERABLE_FIELDS = [
  'department',
  'status',
  'region',
  'accountType',
  'manager',
  'locked'
];

class AccountService {
  /**
   * List accounts with pagination, search, filtering and sorting.
   * @param {object} query  Express req.query
   */
  async getAccounts(query = {}) {
    let records = await accountRepository.findAll();

    // ---- Filtering (exact match on whitelisted fields) ----
    for (const field of FILTERABLE_FIELDS) {
      if (query[field] === undefined || query[field] === '') continue;
      let value = query[field];
      if (field === 'locked') {
        const wanted = String(value).toLowerCase() === 'true';
        records = records.filter((r) => Boolean(r.locked) === wanted);
      } else {
        records = records.filter(
          (r) => String(r[field]).toLowerCase() === String(value).toLowerCase()
        );
      }
    }

    // ---- Free-text search ----
    if (query.search && String(query.search).trim() !== '') {
      const needle = String(query.search).trim().toLowerCase();
      records = records.filter((r) =>
        SEARCHABLE_FIELDS.some((f) =>
          String(r[f] || '').toLowerCase().includes(needle)
        )
      );
    }

    // ---- Sorting ----
    const sortBy = query.sortBy || 'displayName';
    const sortOrder = String(query.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;
    records.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      if (typeof av === 'string') {
        return av.localeCompare(String(bv)) * sortOrder;
      }
      return (av > bv ? 1 : av < bv ? -1 : 0) * sortOrder;
    });

    const total = records.length;

    // ---- Pagination ----
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
    const start = (page - 1) * limit;
    const data = records.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  /** Fetch a single account or throw 404. */
  async getAccountById(id) {
    const account = await accountRepository.findById(id);
    if (!account) throw ApiError.notFound(`Account "${id}" not found`);
    return account;
  }

  /** Validates that every id in `groupIds` refers to an existing group. */
  async _assertGroupsExist(groupIds = []) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) return;
    const groups = await groupRepository.findAll();
    const known = new Set(groups.map((g) => g.id));
    const missing = groupIds.filter((g) => !known.has(g));
    if (missing.length > 0) {
      throw ApiError.badRequest(
        `Unknown group id(s): ${missing.join(', ')}`,
        missing.map((g) => ({ field: 'groups', message: `Group "${g}" does not exist` }))
      );
    }
  }

  /** Create a new account, enforcing uniqueness and referential integrity. */
  async createAccount(payload, actor = 'system') {
    const username = payload.username;

    // Uniqueness checks
    if (await accountRepository.findByUsername(username)) {
      throw ApiError.conflict(`Username "${username}" already exists`);
    }
    if (payload.employeeNumber && (await accountRepository.findByEmployeeNumber(payload.employeeNumber))) {
      throw ApiError.conflict(`Employee number "${payload.employeeNumber}" already exists`);
    }
    if (payload.email && (await accountRepository.findByEmail(payload.email))) {
      throw ApiError.conflict(`Email "${payload.email}" already exists`);
    }

    const groups = Array.isArray(payload.groups) ? payload.groups : [];
    await this._assertGroupsExist(groups);

    // Assemble the record with sensible defaults for anything not supplied.
    const id = payload.id || payload.employeeNumber || username;
    const account = {
      id,
      employeeNumber: payload.employeeNumber || id,
      name: payload.name || username,
      displayName: payload.displayName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || username,
      givenName: payload.givenName || payload.firstName || '',
      familyName: payload.familyName || payload.lastName || '',
      email: payload.email || '',
      secondaryEmail: payload.secondaryEmail || '',
      phoneNumber: payload.phoneNumber || '',
      secondaryPhoneNumber: payload.secondaryPhoneNumber || '',
      manager: payload.manager || '',
      accountId: payload.accountId || '',
      username,
      // Authentication model: password defaults to the username.
      password: payload.password || username,
      firstName: payload.firstName || payload.givenName || '',
      lastName: payload.lastName || payload.familyName || '',
      status: payload.status || 'active',
      locked: payload.locked === undefined ? false : Boolean(payload.locked),
      department: payload.department || '',
      region: payload.region || '',
      accountType: payload.accountType || 'Employee',
      groups
    };

    await accountRepository.create(account);
    logger.audit('ACCOUNT_CREATE', `Account created: ${account.username} (${account.id})`, {
      actor,
      targetId: account.id
    });
    return account;
  }

  /** Update an existing account. */
  async updateAccount(id, changes, actor = 'system') {
    const existing = await accountRepository.findById(id);
    if (!existing) throw ApiError.notFound(`Account "${id}" not found`);

    // Uniqueness re-checks only when the value actually changes.
    if (changes.username && changes.username !== existing.username) {
      const clash = await accountRepository.findByUsername(changes.username);
      if (clash && clash.id !== id) {
        throw ApiError.conflict(`Username "${changes.username}" already exists`);
      }
    }
    if (changes.employeeNumber && changes.employeeNumber !== existing.employeeNumber) {
      const clash = await accountRepository.findByEmployeeNumber(changes.employeeNumber);
      if (clash && clash.id !== id) {
        throw ApiError.conflict(`Employee number "${changes.employeeNumber}" already exists`);
      }
    }
    if (changes.email && changes.email !== existing.email) {
      const clash = await accountRepository.findByEmail(changes.email);
      if (clash && clash.id !== id) {
        throw ApiError.conflict(`Email "${changes.email}" already exists`);
      }
    }
    if (changes.groups) {
      await this._assertGroupsExist(changes.groups);
    }

    // The primary key and password are never changed via a generic update.
    const { id: _ignore, ...safeChanges } = changes;
    const updated = await accountRepository.update(id, safeChanges);
    logger.audit('ACCOUNT_UPDATE', `Account updated: ${updated.username} (${updated.id})`, {
      actor,
      targetId: id,
      fields: Object.keys(safeChanges)
    });
    return updated;
  }

  /** Delete an account. */
  async deleteAccount(id, actor = 'system') {
    const existing = await accountRepository.findById(id);
    if (!existing) throw ApiError.notFound(`Account "${id}" not found`);
    await accountRepository.delete(id);
    logger.audit('ACCOUNT_DELETE', `Account deleted: ${existing.username} (${id})`, {
      actor,
      targetId: id
    });
    return { id, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // Group assignment (entitlement membership) operations
  // ---------------------------------------------------------------------------

  /** Return the full group objects currently assigned to an account. */
  async getAccountGroups(id) {
    const account = await this.getAccountById(id);
    const allGroups = await groupRepository.findAll();
    const byId = new Map(allGroups.map((g) => [g.id, g]));
    // Preserve assignment order; fall back to a stub if a group was deleted.
    return (account.groups || []).map(
      (gid) => byId.get(gid) || { id: gid, name: gid, displayName: gid, description: '(group no longer exists)' }
    );
  }

  /** Assign a group (entitlement) to an account. */
  async assignGroup(id, groupId, actor = 'system') {
    const account = await this.getAccountById(id);
    const group = await groupRepository.findById(groupId);
    if (!group) throw ApiError.badRequest(`Group "${groupId}" does not exist`);

    const current = account.groups || [];
    if (current.includes(groupId)) {
      throw ApiError.conflict(`Account "${id}" already has group "${groupId}"`);
    }

    const updated = await accountRepository.update(id, { groups: [...current, groupId] });
    logger.audit('GROUP_ASSIGN', `Group ${groupId} assigned to ${account.username}`, {
      actor,
      targetId: id,
      groupId
    });
    return updated;
  }

  /** Assign one or more groups to an account. */
  async assignGroups(id, groupIds = [], actor = 'system') {
    const account = await this.getAccountById(id);
    const wanted = Array.from(new Set((groupIds || []).filter(Boolean)));
    if (wanted.length === 0) {
      throw ApiError.badRequest('At least one group id is required');
    }

    await this._assertGroupsExist(wanted);

    const current = account.groups || [];
    const next = Array.from(new Set([...current, ...wanted]));
    const added = wanted.filter((g) => !current.includes(g));

    if (added.length === 0) {
      throw ApiError.conflict(`Account "${id}" already has all requested group assignments`);
    }

    const updated = await accountRepository.update(id, { groups: next });
    logger.audit('GROUP_ASSIGN', `Groups [${added.join(', ')}] assigned to ${account.username}`, {
      actor,
      targetId: id,
      groupIds: added
    });
    return updated;
  }

  /** Remove a group (entitlement) from an account. */
  async removeGroup(id, groupId, actor = 'system') {
    const account = await this.getAccountById(id);
    const current = account.groups || [];
    if (!current.includes(groupId)) {
      throw ApiError.notFound(`Account "${id}" does not have group "${groupId}"`);
    }
    const updated = await accountRepository.update(id, {
      groups: current.filter((g) => g !== groupId)
    });
    logger.audit('GROUP_UNASSIGN', `Group ${groupId} removed from ${account.username}`, {
      actor,
      targetId: id,
      groupId
    });
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  /** Aggregate counts for the dashboard cards & charts. */
  async getDashboardStats() {
    const accounts = await accountRepository.findAll();
    const groups = await groupRepository.findAll();

    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.status === 'active').length;
    const inactiveAccounts = accounts.filter((a) => a.status !== 'active').length;
    const lockedAccounts = accounts.filter((a) => Boolean(a.locked)).length;

    // Extra breakdowns used by the charts.
    const byDepartment = countBy(accounts, 'department');
    const byAccountType = countBy(accounts, 'accountType');
    const groupUsage = groups
      .map((g) => ({
        id: g.id,
        name: g.displayName || g.name,
        count: accounts.filter((a) => (a.groups || []).includes(g.id)).length
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      lockedAccounts,
      totalGroups: groups.length,
      byDepartment,
      byAccountType,
      groupUsage
    };
  }
}

/** Small helper: count records grouped by a field into { key: count }. */
function countBy(records, field) {
  return records.reduce((acc, r) => {
    const key = r[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

module.exports = new AccountService();
