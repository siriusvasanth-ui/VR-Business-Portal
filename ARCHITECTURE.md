# Architecture

## 1. Purpose & Scope

The VR Business Portal is a **source/target business application** — the kind of downstream system an identity governance tool later connects to. It manages three things only:

- **Accounts**
- **Groups (Entitlements)**
- **Group Assignments** (entitlement membership, stored on the account)

It deliberately implements **none** of the following: roles, access requests, approval workflows, certifications, campaigns, governance, policies, manager approvals, tickets, or provisioning engines. Those concerns belong to the IAM platform (e.g. SailPoint) that will aggregate this application via the Web Services Connector.

Two design goals drive every decision:

1. **SailPoint-ready** — accounts, groups and memberships are exposed over plain REST/JSON in shapes the Web Services Connector can aggregate.
2. **Storage-agnostic** — the JSON file store can be replaced by JDBC/MySQL/PostgreSQL by swapping one layer, with no change to services, the API, or the UI.

## 2. Layered Architecture

```text
┌─────────────────────────────────────────────┐
│  Frontend  (React + Vite + Material UI)       │  Presentation
│  pages / components / context / api client    │
└───────────────┬─────────────────────────────-┘
                │  HTTP + JWT (JSON)
┌───────────────▼─────────────────────────────┐
│  REST API  (Express routers)                 │  Interface / Controller
│  routes/auth.js  accounts.js  groups.js       │
│  + middleware: auth, validation, errors       │
└───────────────┬─────────────────────────────-┘
                │  plain method calls
┌───────────────▼─────────────────────────────┐
│  Services                                    │  Business logic
│  accountService  groupService  authService   │
│  - validation orchestration                  │
│  - uniqueness & referential integrity        │
│  - audit logging                             │
└───────────────┬─────────────────────────────-┘
                │  repository interface
┌───────────────▼─────────────────────────────┐
│  Repositories   (data access only)           │  Persistence
│  JsonRepository → account/group repositories  │
│  chosen by repositories/index.js (factory)    │
└───────────────┬─────────────────────────────-┘
                │  file I/O today
┌───────────────▼─────────────────────────────┐
│  JSON Files  (accounts.json, groups.json)     │  Storage
│  → future: JDBC / MySQL / PostgreSQL          │
└──────────────────────────────────────────────┘
```

### The golden rule

> **The service layer must never access JSON files directly. All file operations live in repository classes.**

This is what makes the storage swappable. Services depend only on the *shape* of the repository methods (`findAll`, `findById`, `create`, `update`, `delete`, plus a few domain finders), never on how or where data is stored.

## 3. Request Lifecycle (example: create account)

1. **UI** submits the form → `POST /api/accounts` with a Bearer token.
2. **authMiddleware** verifies the JWT and attaches `req.user`.
3. **validate(createAccount)** runs express-validator chains (required fields, email format, types).
4. **Route handler** calls `accountService.createAccount(payload, actor)`.
5. **Service** enforces uniqueness (username / employeeNumber / email), verifies every `groupId` exists (referential integrity), applies defaults (e.g. `password = username`), then calls `accountRepository.create(...)`.
6. **Repository** serialises the write (temp-file + rename) to `accounts.json`.
7. **Service** emits a Winston audit event `ACCOUNT_CREATE`.
8. **Route** returns `201 { success, data }`; errors flow to the central error handler as `{ success:false, error:{ status, message, details } }`.

## 4. Authentication

Authentication is isolated behind a single seam in `authService.js`:

- `authenticateCredentials(username, password)` — the **only** function that knows *how* identity is proven. Today it checks local credentials (password equals username) and account state (not locked, active).
- `issueToken(account)` / `verifyToken(token)` — JWT concerns.

To adopt **Microsoft Entra ID / SAML / OIDC / OAuth2**, replace the body of `authenticateCredentials` (and, if needed, token verification). Routes, services, middleware and UI remain unchanged.

## 5. Error Handling

- A typed `ApiError(statusCode, message, details)` is thrown from services.
- `asyncHandler` forwards rejected promises to Express.
- A central `errorHandler` renders a consistent JSON envelope and logs 5xx errors with stack traces.

## 6. Validation Strategy

Two complementary layers:

- **Shape/format** at the edge (express-validator): required fields, valid email, correct types, id pattern.
- **Domain rules** in services: unique username / employee number / email, existing group ids, "group in use" protection on delete.

## 7. Cross-Cutting Concerns

| Concern | Where | Notes |
|---------|-------|-------|
| Config | `config/config.js` | single source of truth; nothing else reads `process.env` |
| Logging | `config/logger.js` | Winston JSON file + console; `logger.audit(event, msg, meta)` |
| CORS | `app.js` | configurable via `CORS_ORIGIN` |
| Static hosting | `app.js` | serves `frontend/dist` when present (single-service deploy) |

## 8. Frontend Composition

- **State/session:** `AuthContext` (JWT + user), `ColorModeContext` (light/dark theme), `ToastContext` (notifications).
- **Routing:** `react-router-dom`; all app pages sit behind `ProtectedRoute` + `Layout`.
- **API:** a single axios instance attaches the JWT and redirects to `/login` on 401.
- **Pages:** Login, Dashboard (cards + charts), Accounts (table + CRUD dialogs), Groups (CRUD), Group Assignments.

## 9. Why this shape is SailPoint-friendly

- Accounts are a flat, aggregatable collection with a stable primary key (`id` / `employeeNumber`).
- Entitlements (`groups`) are a first-class collection *and* embedded on accounts, so the Web Services Connector can read **accounts**, **entitlements**, and **memberships** without bespoke endpoints.
- Everything is JSON over REST with predictable pagination, so connector "account aggregation" and "entitlement aggregation" operations map directly onto `GET /api/accounts` and `GET /api/groups`.
