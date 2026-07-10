# Future Migration Strategy: JSON → JDBC / MySQL / PostgreSQL

This document describes how to move the VR Business Portal from JSON-file storage to a relational database **without changing the service layer, the REST API, or the UI**. Only the repository layer changes.

> Terminology: in the Node.js world there is no literal "JDBC" driver (JDBC is a Java API). Here **"JDBC repository"** means *a repository backed by a relational database over a SQL driver* — `pg` for PostgreSQL, `mysql2` for MySQL, or a Java/JDBC service if this backend is later re-hosted on the JVM. The pattern is identical regardless.

## What changes and what does not

| Layer | Changes? |
|-------|----------|
| Frontend (React/MUI) | ❌ No |
| REST API (Express routes) | ❌ No |
| Services (business logic) | ❌ No |
| **Repositories** | ✅ **Yes — new implementation** |
| Factory (`repositories/index.js`) | ✅ One new branch |
| Config / env | ✅ Add DB connection settings |

Because services depend only on the repository **method contract** (see [`REPOSITORY_PATTERN.md`](./REPOSITORY_PATTERN.md)), a new database-backed class that honours that contract drops straight in.

## Target schema

Two tables plus a join table for the many-to-many account↔group relationship. (In the JSON store, membership is embedded in `accounts.groups`; in SQL it becomes a join table, and repositories translate between the two so the API payload stays identical.)

```sql
-- accounts
CREATE TABLE accounts (
  id                    VARCHAR(64) PRIMARY KEY,
  employee_number       VARCHAR(64) UNIQUE NOT NULL,
  name                  VARCHAR(128),
  display_name          VARCHAR(128),
  given_name            VARCHAR(64),
  family_name           VARCHAR(64),
  email                 VARCHAR(256) UNIQUE NOT NULL,
  secondary_email       VARCHAR(256),
  phone_number          VARCHAR(32),
  secondary_phone       VARCHAR(32),
  manager               VARCHAR(64),
  account_id            VARCHAR(64),
  username              VARCHAR(64) UNIQUE NOT NULL,
  password              VARCHAR(256) NOT NULL,   -- store a HASH in production
  first_name            VARCHAR(64),
  last_name             VARCHAR(64),
  status                VARCHAR(16) NOT NULL DEFAULT 'active',
  locked                BOOLEAN NOT NULL DEFAULT FALSE,
  department            VARCHAR(64),
  region                VARCHAR(64),
  account_type          VARCHAR(32)
);

-- groups (entitlements)
CREATE TABLE groups (
  id            VARCHAR(64) PRIMARY KEY,
  name          VARCHAR(128) NOT NULL,
  description   TEXT,
  created       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  display_name  VARCHAR(128)
);

-- membership (account ↔ group)
CREATE TABLE account_groups (
  account_id  VARCHAR(64) REFERENCES accounts(id) ON DELETE CASCADE,
  group_id    VARCHAR(64) REFERENCES groups(id)   ON DELETE RESTRICT,
  PRIMARY KEY (account_id, group_id)
);
```

## Step-by-step migration

### 1. Add a driver and connection config

```bash
npm install pg          # PostgreSQL   (or: npm install mysql2  for MySQL)
```

Add to `config/config.js` (read from env):

```js
db: {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}
```

### 2. Implement the same contract

Create `repositories/sql/PostgresAccountRepository.js` exposing exactly the methods the JSON repository exposes:

```js
class PostgresAccountRepository {
  constructor(pool) { this.pool = pool; }

  async findAll() {
    const { rows } = await this.pool.query('SELECT * FROM accounts ORDER BY display_name');
    return Promise.all(rows.map((r) => this._withGroups(r)));
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    return rows[0] ? this._withGroups(rows[0]) : null;
  }

  async findByUsername(username) {
    const { rows } = await this.pool.query(
      'SELECT * FROM accounts WHERE LOWER(username) = LOWER($1)', [username]
    );
    return rows[0] ? this._withGroups(rows[0]) : null;
  }

  async create(account) {
    // INSERT into accounts, then INSERT rows into account_groups (in a TX)
  }

  async update(id, changes) { /* UPDATE ... RETURNING *, reconcile membership */ }
  async delete(id) { /* DELETE FROM accounts WHERE id = $1 */ }

  // Maps a DB row (snake_case + join table) to the API shape (camelCase + groups[])
  async _withGroups(row) {
    const { rows } = await this.pool.query(
      'SELECT group_id FROM account_groups WHERE account_id = $1', [row.id]
    );
    return toApiShape(row, rows.map((r) => r.group_id));
  }
}
```

> **Key adapter responsibility:** repositories translate between the DB representation (snake_case columns + `account_groups` join table) and the **exact JSON shape the API already returns** (camelCase fields + embedded `groups` array). This keeps the SailPoint-facing payload byte-for-byte compatible.

### 3. Wire it into the factory

```js
// repositories/index.js
const { Pool } = require('pg');

case 'postgres': {
  const pool = new Pool(config.db);
  accountRepository = new PostgresAccountRepository(pool);
  groupRepository   = new PostgresGroupRepository(pool);
  break;
}
```

### 4. Flip the switch

```bash
REPOSITORY_TYPE=postgres
DB_HOST=... DB_PORT=5432 DB_USER=... DB_PASSWORD=... DB_NAME=...
```

No service, route, or UI file is touched.

### 5. One-time data load

Seed the tables from the existing JSON:

```sql
-- pseudocode: for each account in accounts.json → INSERT accounts + account_groups
-- for each group in groups.json → INSERT groups
```

A tiny Node script can read the two JSON files and run the inserts through the same pool.

## Things to tighten during migration

- **Password hashing.** The demo stores `password = username` in plain text. When moving to a database, store a bcrypt/argon2 hash and update `authenticateCredentials` accordingly (the auth seam already isolates this).
- **Transactions.** Wrap account create/update + membership changes in a transaction so partial writes can't occur.
- **Uniqueness.** Enforce via DB constraints (`UNIQUE`) in addition to the service-level checks.
- **Referential integrity.** The `account_groups` foreign keys enforce "existing group ids" at the database level; keep the `ON DELETE RESTRICT` so a group in use cannot be deleted (matching current service behaviour).
- **Connection pooling / retries.** Configure the pool for the target host (e.g. Render/managed DB).

## Verification checklist

- [ ] Same JSON response shapes for `GET /api/accounts`, `GET /api/groups`, `GET /api/accounts/:id/groups`
- [ ] Uniqueness (username/employeeNumber/email) still enforced
- [ ] "Group still assigned" delete protection still works
- [ ] Audit logs still emitted
- [ ] SailPoint aggregation unaffected (payloads unchanged)
