# VR Business Portal

A simple, production-quality full-stack business system that manages **Accounts**, **Groups (Entitlements)** and **Group Assignments**. It is intentionally *not* an IAM platform — there are no roles, access requests, approvals, certifications, campaigns, policies or provisioning engines. The application is designed to be **onboarded into SailPoint later using the Web Services Connector**, and to allow its **JSON storage to be swapped for JDBC / MySQL / PostgreSQL** without touching business logic.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Quick Start (Local)](#quick-start-local)
- [Seed Data & Credentials](#seed-data--credentials)
- [API Reference](#api-reference)
- [Swagger / OpenAPI](#swagger--openapi)
- [Logging](#logging)
- [SailPoint Web Services Connector](#sailpoint-web-services-connector-compatibility)
- [Documentation](#documentation)

---

## Features

- **Accounts** — full CRUD with pagination, free-text search, filtering and sorting.
- **Groups (Entitlements)** — full CRUD; a group cannot be deleted while still assigned.
- **Group Assignments** — assign / remove entitlements directly on account objects.
- **JWT authentication** — password equals username (demo model), isolated behind a replaceable provider seam.
- **Dashboard** — total / active / inactive / locked accounts, total groups, plus department and entitlement-usage charts.
- **Validation** — required fields, valid email, unique username / employee number / email, existing group ids.
- **Swagger UI** at `/api-docs`.
- **Winston logging** of all security-relevant events to `backend/logs/application.log`.
- **Modern MUI UI** — responsive, light/dark theme, search, pagination, sorting, confirmation dialogs, toasts, loading indicators, error handling.
- **Swappable repository layer** — JSON today; JDBC/MySQL/PostgreSQL later with no service or UI changes.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Material UI (MUI), MUI X Charts, Axios, React Router |
| Backend | Node.js, Express.js |
| Storage | JSON files (swappable repository layer) |
| Auth | JWT (`jsonwebtoken`) |
| Docs | Swagger / OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) |
| Logging | Winston |
| Hosting | Render |
| Source Control | GitHub |

---

## Architecture

Clean, layered architecture. **The service layer never touches JSON files** — all file access is isolated in the repository layer.

```text
Frontend (React + MUI)
      │  HTTP / JSON
      ▼
REST API (Express routes)
      │
      ▼
Services (business logic, validation, audit)
      │
      ▼
Repositories (data access — the ONLY layer that reads/writes storage)
      │
      ▼
JSON Files   →  (future) JDBC / MySQL / PostgreSQL
```

The concrete repository is chosen by a factory (`backend/repositories/index.js`) based on `REPOSITORY_TYPE`. See [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/REPOSITORY_PATTERN.md`](./docs/REPOSITORY_PATTERN.md) and [`docs/JDBC_MIGRATION.md`](./docs/JDBC_MIGRATION.md).

---

## Folder Structure

```text
vr-business-portal/
├── backend/
│   ├── data/            accounts.json, groups.json  (seed data / JSON storage)
│   ├── routes/          auth.js, accounts.js, groups.js  (REST layer)
│   ├── services/        accountService.js, groupService.js, authService.js
│   ├── repositories/    JsonRepository, accountRepository, groupRepository, index.js (factory)
│   ├── middleware/      authMiddleware.js, errorHandler.js, validate.js
│   ├── validators/      accountValidator.js, groupValidator.js
│   ├── config/          config.js, logger.js
│   ├── utils/           ApiError.js, asyncHandler.js
│   ├── logs/            application.log
│   ├── app.js           Express entry point
│   ├── swagger.js       OpenAPI spec + Swagger UI
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/         axios client + resource modules
│   │   ├── components/  Layout, ProtectedRoute, dialogs
│   │   ├── context/     Auth, ColorMode (theme), Toast
│   │   ├── pages/       Login, Dashboard, Accounts, Groups, GroupAssignments
│   │   └── theme/       theme.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/                Installation, Render deploy, Repository pattern, JDBC migration
├── render.yaml          Render blueprint
├── ARCHITECTURE.md
└── README.md
```

---

## Quick Start (Local)

**Prerequisites:** Node.js 18+ and npm.

### 1. Backend

```bash
cd backend
cp .env.example .env      # optional; sensible defaults are built in
npm install
npm run dev               # or: npm start
# API on http://localhost:5000  ·  Swagger on http://localhost:5000/api-docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173  (Vite proxies /api to the backend on :5000)
```

Open **http://localhost:5173** and sign in (see credentials below).

> Full details, troubleshooting and the single-service option are in [`docs/INSTALLATION.md`](./docs/INSTALLATION.md).

---

## Seed Data & Credentials

10 seeded accounts (from `VR_AuthSource.csv`). **Password = username.**

| Employee | Username | Department | Type | Groups |
|----------|----------|-----------|------|--------|
| Adele Vance | `adele.vance` | IT | Employee | WS-ENT100 |
| Diego Siciliani | `diego.siciliani` | Operations | Employee | WS-ENT100 |
| Gladstone Abraham | `gladstone_abraham` | IT | Manager | WS-ENT100, WS-ENT200, WS-ENT300 |
| Henrietta Mueller | `henrietta.mueller` | IT | Employee | WS-ENT100, WS-ENT200 |
| Johanna Lorenz | `johanna.lorenz` | Finance | Manager | WS-ENT100, WS-ENT200, WS-ENT500 |
| Lee Gu | `lee.gu` | Sales | Manager | WS-ENT100, WS-ENT200 |
| Lynne Robbins | `lynne.robbins` | HR | Manager | WS-ENT100, WS-ENT200, WS-ENT400 |
| Miriam Graham | `miriam.graham` | Manufacturing | Manager | WS-ENT100, WS-ENT200 |
| Pradeep Gupta | `pradeep.gupta` | Finance | Employee | WS-ENT100, WS-ENT500 |
| Vasanth Ram | `vasanth_ram` | IT | Privileged | WS-ENT100, WS-ENT200, WS-ENT300 |

**Groups (entitlements):** `WS-ENT100` Web Standard Account · `WS-ENT200` Web Elevated Account · `WS-ENT300` Web Administrator · `WS-ENT400` HR Portal Access · `WS-ENT500` Finance Portal Access.

Example login:

```json
{ "username": "vasanth_ram", "password": "vasanth_ram" }
```

---

## API Reference

Base URL: `/api`. All routes except `POST /api/auth/login`, `/health` and `/api-docs` require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate, returns `{ success, token, user }` |

### Accounts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | List (pagination, search, filter, sort) |
| GET | `/api/accounts/:id` | Get one |
| POST | `/api/accounts` | Create |
| PUT | `/api/accounts/:id` | Update |
| DELETE | `/api/accounts/:id` | Delete |
| GET | `/api/accounts/stats` | Dashboard aggregates |

Query example: `GET /api/accounts?department=IT&status=active&search=adele&page=1&limit=10&sortBy=displayName&sortOrder=asc`

### Groups
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/groups` | List |
| GET | `/api/groups/:id` | Get one |
| POST | `/api/groups` | Create |
| PUT | `/api/groups/:id` | Update |
| DELETE | `/api/groups/:id` | Delete (refused if still assigned) |

### Group Assignments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts/:id/groups` | List an account's groups |
| POST | `/api/accounts/:id/groups` | Assign `{ "groupId": "WS-ENT200" }` |
| DELETE | `/api/accounts/:id/groups/:groupId` | Remove |

---

## Swagger / OpenAPI

Interactive docs at **`/api-docs`**; raw spec at **`/api-docs.json`**. Click **Authorize**, paste the JWT from `POST /api/auth/login`, and try any endpoint.

---

## Logging

Winston writes structured JSON to `backend/logs/application.log` (and pretty output to the console). Audited events: **Login, Create/Update/Delete Account, Create/Update/Delete Group, Group Assign/Unassign.**

---

## SailPoint Web Services Connector Compatibility

The API is shaped for later aggregation by the SailPoint **Web Services Connector**:

- **Account aggregation:** `GET /api/accounts` returns account objects that already include their entitlements in the `groups` array.
- **Group (entitlement) aggregation:** `GET /api/groups`.
- **Group memberships:** returned inside each account payload — no separate membership call required.

```json
{
  "id": "VR_EMP_020",
  "username": "vasanth_ram",
  "groups": ["WS-ENT100", "WS-ENT200", "WS-ENT300"]
}
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layered architecture, data flow, design decisions |
| [docs/INSTALLATION.md](./docs/INSTALLATION.md) | Local setup & troubleshooting |
| [docs/RENDER_DEPLOYMENT.md](./docs/RENDER_DEPLOYMENT.md) | Deploy to Render (blueprint + manual) |
| [docs/REPOSITORY_PATTERN.md](./docs/REPOSITORY_PATTERN.md) | The repository abstraction explained |
| [docs/JDBC_MIGRATION.md](./docs/JDBC_MIGRATION.md) | Future JSON → JDBC/MySQL/PostgreSQL strategy |

---

## License

MIT.
