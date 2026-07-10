# Render Deployment Guide

This project deploys cleanly to [Render](https://render.com). Two approaches are documented:

- **A. Blueprint (recommended)** — one `render.yaml` provisions both services.
- **B. Manual** — create the two services by hand in the dashboard.
- **C. Single service** — the backend serves the built frontend (one URL).

> ⚠️ **Storage note (important).** The JSON files are written on the service's local disk. Render's free web services have an **ephemeral filesystem** — changes to accounts/groups are lost on redeploy or restart. This is fine for a demo/POC. For durable writes, attach a **Render Disk** to the backend and point the data directory at it, or migrate to a database (see `JDBC_MIGRATION.md`).

---

## A. Deploy with the Blueprint (recommended)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, select the repo. Render reads [`render.yaml`](../render.yaml) and proposes two services:
   - `vr-business-portal-api` (Node web service, `rootDir: backend`)
   - `vr-business-portal-web` (static site, `rootDir: frontend`)
3. Click **Apply**. `JWT_SECRET` is auto-generated for the API.
4. After the first deploy, wire the two together:
   - Copy the API URL, e.g. `https://vr-business-portal-api.onrender.com`.
   - On the **web** service set `VITE_API_BASE_URL` to that URL, then **redeploy** it.
   - On the **api** service set `CORS_ORIGIN` to the web URL, e.g. `https://vr-business-portal-web.onrender.com`, then **redeploy**.
5. Open the web URL and sign in (`vasanth_ram` / `vasanth_ram`).

---

## B. Manual Setup

### B.1 Backend (Web Service)

- **New → Web Service** → connect the repo.
- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `node app.js`
- Health Check Path: `/health`
- Environment variables:

  | Key | Value |
  |-----|-------|
  | `NODE_ENV` | `production` |
  | `JWT_SECRET` | *(a long random string)* |
  | `JWT_EXPIRES_IN` | `8h` |
  | `REPOSITORY_TYPE` | `json` |
  | `CORS_ORIGIN` | *(your frontend URL, set after step B.2)* |

  Render provides `PORT` automatically; the app reads it.

### B.2 Frontend (Static Site)

- **New → Static Site** → same repo.
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment variable: `VITE_API_BASE_URL` = your backend URL.
- Add a **Rewrite Rule** for SPA routing: Source `/*` → Destination `/index.html` (Action: Rewrite).

Then set the backend `CORS_ORIGIN` to the static site URL and redeploy the backend.

---

## C. Single-Service Deployment (one URL)

The backend automatically serves `frontend/dist` when it exists, so you can run everything as one web service.

- **New → Web Service** → repo root.
- Root Directory: *(leave blank / repo root)*
- Build Command:
  ```bash
  cd frontend && npm install && npm run build && cd ../backend && npm install
  ```
- Start Command:
  ```bash
  node backend/app.js
  ```
- Env vars: `NODE_ENV=production`, `JWT_SECRET=...`, `REPOSITORY_TYPE=json`.
- Leave `VITE_API_BASE_URL` empty — the UI calls the same origin.

Open the single service URL and sign in.

---

## Optional: Durable JSON storage with a Render Disk

1. On the backend service: **Disks → Add Disk** (e.g. mount at `/var/data`, 1 GB).
2. Copy the seed files there on first boot, or set an env var and update `JsonRepository` to read the data directory from config (e.g. `DATA_DIR`).
3. Redeploy. Writes now persist across restarts.

> For production-grade durability and concurrency, prefer a managed database and swap the repository implementation — see [`JDBC_MIGRATION.md`](./JDBC_MIGRATION.md).

---

## Post-Deploy Checklist

- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] `POST /api/auth/login` returns a token
- [ ] Swagger reachable at `<api-url>/api-docs`
- [ ] Frontend loads and can list accounts after login
- [ ] `CORS_ORIGIN` (backend) and `VITE_API_BASE_URL` (frontend) point at each other (split deploy)
- [ ] `JWT_SECRET` is a strong, unique value
