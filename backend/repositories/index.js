'use strict';

/**
 * Repository factory / composition root.
 *
 * The rest of the application imports repositories from THIS module only. It
 * decides — based on `config.repository.type` — which concrete implementation
 * to instantiate. Swapping JSON for JDBC/MySQL/PostgreSQL means adding a new
 * branch here and a new class; services and routes never change.
 *
 *   const { accountRepository, groupRepository } = require('../repositories');
 */

const config = require('../config/config');
const logger = require('../config/logger');

const AccountRepository = require('./accountRepository');
const GroupRepository = require('./groupRepository');

let accountRepository;
let groupRepository;

switch (config.repository.type) {
  case 'json':
    accountRepository = new AccountRepository();
    groupRepository = new GroupRepository();
    break;

  // Future implementations plug in here without touching the service layer:
  // case 'jdbc':
  // case 'mysql':
  // case 'postgres':
  //   accountRepository = new SqlAccountRepository(pool);
  //   groupRepository = new SqlGroupRepository(pool);
  //   break;

  default:
    throw new Error(
      `Unsupported REPOSITORY_TYPE "${config.repository.type}". Supported: json`
    );
}

logger.info(`Repository layer initialised (type=${config.repository.type})`);

module.exports = { accountRepository, groupRepository };
