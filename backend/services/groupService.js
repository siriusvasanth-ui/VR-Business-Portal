'use strict';

/**
 * Group (entitlement) service — CRUD business logic for groups.
 * Talks only to the repository layer. Emits audit logs for mutations and
 * protects against deleting a group that is still assigned to accounts.
 */

const { groupRepository, accountRepository } = require('../repositories');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

class GroupService {
  /** List groups with optional free-text search and sorting. */
  async getGroups(query = {}) {
    let groups = await groupRepository.findAll();

    if (query.search && String(query.search).trim() !== '') {
      const needle = String(query.search).trim().toLowerCase();
      groups = groups.filter((g) =>
        ['id', 'name', 'displayName', 'description'].some((f) =>
          String(g[f] || '').toLowerCase().includes(needle)
        )
      );
    }

    const sortBy = query.sortBy || 'id';
    const sortOrder = String(query.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;
    groups.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * sortOrder);

    return groups;
  }

  /** Fetch a single group or throw 404. */
  async getGroupById(id) {
    const group = await groupRepository.findById(id);
    if (!group) throw ApiError.notFound(`Group "${id}" not found`);
    return group;
  }

  /** Create a new group (entitlement). */
  async createGroup(payload, actor = 'system') {
    if (await groupRepository.findById(payload.id)) {
      throw ApiError.conflict(`Group id "${payload.id}" already exists`);
    }
    const group = {
      id: payload.id,
      name: payload.name,
      description: payload.description || '',
      created: payload.created || new Date().toISOString(),
      displayName: payload.displayName || payload.name
    };
    await groupRepository.create(group);
    logger.audit('GROUP_CREATE', `Group created: ${group.id} (${group.name})`, {
      actor,
      targetId: group.id
    });
    return group;
  }

  /** Update an existing group. The id is immutable. */
  async updateGroup(id, changes, actor = 'system') {
    const existing = await groupRepository.findById(id);
    if (!existing) throw ApiError.notFound(`Group "${id}" not found`);

    const { id: _ignore, created: _ignore2, ...safeChanges } = changes;
    const updated = await groupRepository.update(id, safeChanges);
    logger.audit('GROUP_UPDATE', `Group updated: ${id}`, {
      actor,
      targetId: id,
      fields: Object.keys(safeChanges)
    });
    return updated;
  }

  /** Delete a group, refusing if it is still assigned to any account. */
  async deleteGroup(id, actor = 'system') {
    const existing = await groupRepository.findById(id);
    if (!existing) throw ApiError.notFound(`Group "${id}" not found`);

    const accounts = await accountRepository.findAll();
    const holders = accounts.filter((a) => (a.groups || []).includes(id));
    if (holders.length > 0) {
      throw ApiError.conflict(
        `Group "${id}" is still assigned to ${holders.length} account(s) and cannot be deleted`
      );
    }

    await groupRepository.delete(id);
    logger.audit('GROUP_DELETE', `Group deleted: ${id}`, { actor, targetId: id });
    return { id, deleted: true };
  }
}

module.exports = new GroupService();
