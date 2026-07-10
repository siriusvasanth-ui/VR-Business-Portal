# Installation Guide

## Prerequisites

- **Node.js 18+** and **npm** (`node -v`, `npm -v`)
- **Git**
- A modern browser

## 1. Clone

```bash
git clone https://github.com/<your-org>/vr-business-portal.git
cd vr-business-portal
```

## 2. Backend

```bash
cd backend
cp .env.example .env        # optional — defaults work out of the box
npm install
npm run dev                 # nodemon (auto-reload)  |  or: npm start
```

- API: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- Swagger: `http://localhost:5000/api-docs`

### Backend environment variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment name |
| `PORT` | 5000 | HTTP port |
| `CORS_ORIGIN` | `*` | Allowed origin(s), comma-separated |
| `JWT_SECRET` | dev secret | **Change in production** |
| `JWT_EXPIRES_IN` | 8h | Token lifetime |
| `JWT_ISSUER` | vr-business-portal | Token issuer claim |
| `REPOSITORY_TYPE` | json | Storage backend (`json` today) |
| `LOG_LEVEL` | info | error \| warn \| info \| debug |

## 3. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env        # optional
npm install
npm run dev
```

- App: `http://localhost:5173`
- The Vite dev server **proxies** `/api` and `/api-docs` to `http://localhost:5000`, so no CORS setup is needed locally.

### Frontend environment variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | *(empty)* | Backend base URL. Empty = same-origin (uses the dev proxy or a single-service deploy). Set to the backend URL for split deployments. |

## 4. Sign In

Open `http://localhost:5173`. Password equals username, e.g.:

```text
username: vasanth_ram
password: vasanth_ram
```

## 5. Production Build (optional, local)

```bash
# Build the frontend
cd frontend && npm run build      # outputs frontend/dist

# The backend will automatically serve frontend/dist if present:
cd ../backend && npm start
# Visit http://localhost:5000  (single service serves UI + API)
```

## Verifying the API without the UI

```bash
# Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"vasanth_ram","password":"vasanth_ram"}'

# Use the returned token
TOKEN=<paste-token>
curl -s http://localhost:5000/api/accounts \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `EADDRINUSE :5000` | Another process holds the port. Stop it or set `PORT` in `backend/.env`. |
| Login always fails | Password must equal the username. Confirm the backend is running on 5000. |
| UI loads but calls 401 | Token expired — sign in again. For split deploys, check `VITE_API_BASE_URL`. |
| CORS error (split deploy) | Set backend `CORS_ORIGIN` to the frontend URL. |
| Charts/tables empty | Confirm `backend/data/accounts.json` and `groups.json` exist and are valid JSON. |
| Port 5173 busy | Vite will offer another port; or set `server.port` in `vite.config.js`. |

## Resetting seed data

The seed data lives in `backend/data/accounts.json` and `backend/data/groups.json`. To reset, restore those two files from Git:

```bash
git checkout -- backend/data/accounts.json backend/data/groups.json
```
