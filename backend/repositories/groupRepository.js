'use strict';

/**
 * Group (entitlement) repository — JSON implementation.
 * Extends the generic JsonRepository. Groups are keyed by their business id
 * (e.g. "WS-ENT200"), so no extra finders are required beyond the base class.
 */

const JsonRepository = require('./JsonRepository');

class GroupRepository extends JsonRepository {
  constructor() {
    super('groups.json', 'id');
  }
}

module.exports = GroupRepository;
