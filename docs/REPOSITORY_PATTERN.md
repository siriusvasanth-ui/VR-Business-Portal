# Repository Pattern

The repository pattern is the single most important design decision in this codebase. It is what lets us start with JSON files and later move to JDBC/MySQL/PostgreSQL **without changing services, routes or the UI**.

## The idea

A **repository** is an object that looks like an in-memory collection of domain objects but hides *where* and *how* the data is actually stored. Services ask a repository for data (`findAll`, `findById`, `create`, …) and never know whether the answer came from a file, a SQL table, or a remote API.

```text
Service  ──uses──►  Repository (interface / method contract)
                         ├── JsonRepository        (today)
                         ├── JdbcRepository         (future)
                         ├── MySqlRepository         (future)
                         └── PostgresRepository      (future)
```

## The contract

Every repository — regardless of backing store — exposes the same methods:

| Method | Meaning |
|--------|---------|
| `findAll()` | return all records |
| `findById(id)` | return one record or `null` |
| `findOne(predicate)` | first record matching a function |
| `findMany(predicate)` | all records matching a function |
| `create(record)` | insert and return the record |
| `update(id, changes)` | shallow-merge changes; return updated record or `null` |
| `delete(id)` | remove; return `true`/`false` |

Domain repositories add a few finders:

- `accountRepository.findByUsername(username)`
- `accountRepository.findByEmployeeNumber(employeeNumber)`
- `accountRepository.findByEmail(email)`

As long as a new implementation provides these methods with the same semantics, everything above it keeps working.

## The pieces in this project

```text
backend/repositories/
├── JsonRepository.js        Generic base: all file I/O lives here
├── accountRepository.js     extends JsonRepository('accounts.json') + finders
├── groupRepository.js       extends JsonRepository('groups.json')
└── index.js                 FACTORY — picks the implementation from config
```

### 1. `JsonRepository` — the only file-aware code

It reads/parses the JSON file, and writes via a **temp-file + rename** so a crash mid-write can't corrupt the store. Writes are **serialised** through a per-instance promise chain so concurrent requests can't interleave.

```js
class JsonRepository {
  constructor(fileName, idField = 'id') { /* path + write queue */ }
  async findAll() { /* read file */ }
  async findById(id) { /* read + find */ }
  async create(record) { /* read + push + write */ }
  async update(id, changes) { /* read + merge + write */ }
  async delete(id) { /* read + filter + write */ }
}
```

### 2. Domain repositories

Thin subclasses that bind a file and add domain finders:

```js
class AccountRepository extends JsonRepository {
  constructor() { super('accounts.json', 'id'); }
  async findByUsername(username) { /* case-insensitive */ }
  async findByEmployeeNumber(n)  { /* ... */ }
  async findByEmail(email)       { /* ... */ }
}
```

### 3. The factory / composition root — `index.js`

This is the **one place** that decides which implementation to use, based on `REPOSITORY_TYPE`:

```js
switch (config.repository.type) {
  case 'json':
    accountRepository = new AccountRepository();
    groupRepository   = new GroupRepository();
    break;
  // case 'postgres':
  //   accountRepository = new PostgresAccountRepository(pool);
  //   groupRepository   = new PostgresGroupRepository(pool);
  //   break;
}
module.exports = { accountRepository, groupRepository };
```

Services import from here and nothing else:

```js
const { accountRepository, groupRepository } = require('../repositories');
```

## Why services never touch files

Because the service layer only calls contract methods, a storage swap is invisible to it. Compare the two futures:

```js
// accountService.createAccount — unchanged forever
if (await accountRepository.findByUsername(username)) throw ApiError.conflict(...);
await accountRepository.create(account);
```

Whether `create` writes a JSON file or runs `INSERT INTO accounts ...`, the service is identical.

## Benefits

- **Swappable storage** — JSON → SQL by adding a class + a factory branch.
- **Testable** — inject a fake in-memory repository in unit tests.
- **Single responsibility** — I/O concerns isolated from business rules.
- **Consistency** — one code path for reads/writes, one place to add caching, retries, or transactions later.

## Rules to keep it clean

1. **Never** `require('fs')` or read `data/*.json` outside `repositories/`.
2. **Never** import a concrete repository directly in a service — import from `repositories/index.js`.
3. Keep business logic (validation, uniqueness, audit) in **services**, not repositories.
4. New storage backends implement the **same method contract** — see [`JDBC_MIGRATION.md`](./JDBC_MIGRATION.md).
