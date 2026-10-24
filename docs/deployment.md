# SyncSpace Deployment Guide

This guide documents the production deployment architecture, step-by-step provisioning instructions, configuration parameters, and operational considerations for **SyncSpace**. The architecture is specifically designed to run reliably within **free-tier limits** without sacrificing security, data integrity, or real-time collaboration fidelity.

---

## 1. Production Architecture Overview

SyncSpace separates responsibilities into three purpose-built tiers:

```mermaid
graph TD
    Client["Client Browsers (Desktop & Mobile)"] -->|HTTPS (Next.js App & Server Actions)| Vercel["Vercel (Next.js 16 App Router)"]
    Client -->|WSS (Yjs CRDT & Presence)| CollabHost["Render / Fly.io (SyncSpace Collab Server)"]
    Vercel -->|Prisma Connection Pool| Neon["Neon Serverless PostgreSQL"]
    CollabHost -->|Persistent Direct SQL| Neon
```

### Infrastructure Components

| Component | Recommended Free-Tier Host | Purpose | Free-Tier Allowance |
| :--- | :--- | :--- | :--- |
| **Web & API** | **Vercel** | Next.js 16 App Router, SSR, Server Actions, Route Handlers | Unlimited static, 100GB bandwidth, serverless compute |
| **Database** | **Neon PostgreSQL** | Relational state, audit logs, binary CRDT updates, versions | 0.5 GiB storage, pooled connections, automatic branching |
| **Real-time Server** | **Render / Fly.io / Railway** | Persistent WebSocket hub, Yjs synchronization, awareness, compaction | Render 750 free hrs/mo, or Fly.io 3 free micro VMs |
| **CI / CD** | **GitHub Actions** | Automated linting, type-checks, unit/integration testing, build verification | 2,000 free minutes/month |

---

## 2. Environment Variables & Secret Configuration

SyncSpace strictly separates server-side secrets from public client parameters.

### Required Production Environment Variables

| Variable | Scope | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server Only | Direct PostgreSQL connection string with SSL enabled | `postgresql://user:pass@ep-cool-pool.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | Server Only | High-entropy 32+ byte key for HS256 JWT session signing | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Canonical public URL of the web frontend | `https://syncspace.vercel.app` |
| `NEXT_PUBLIC_COLLAB_WS_URL`| Client & Server | Public WebSocket endpoint for Yjs real-time engine | `wss://syncspace-collab.onrender.com` |
| `COLLAB_PORT` | Server Only | Port for local/standalone WebSocket listener (defaults to 3001) | `3001` or `8080` (Render/Fly) |
| `NODE_ENV` | Server Only | Execution environment mode | `production` |

> [!CAUTION]
> Never prefix database credentials, session secrets, or internal auth keys with `NEXT_PUBLIC_`. In SyncSpace, any variable without `NEXT_PUBLIC_` is excluded from client bundles by Next.js compiler guards.

---

## 3. Step-by-Step Deployment Procedure

### Step 3.1: Database Provisioning (Neon PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech) and create a project named `syncspace-prod`.
2. Select your preferred AWS region (e.g., `us-east-2` or `eu-central-1`).
3. Neon provides both a **Pooled** connection string (`-pooler`) and a **Direct** connection string:
   - For `DATABASE_URL` on Vercel: Use the **Pooled** string (enables PgBouncer connection reuse across serverless lambdas).
   - For `DATABASE_URL` on the Real-time Collaboration server: Use the **Direct** string for long-lived continuous binary transactions.
4. Run migrations from your terminal to establish the schema:
   ```bash
   DATABASE_URL="postgresql://user:password@ep-pooler.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
   ```
5. *(Optional)* Seed demo workspaces, users, and documents:
   ```bash
   DATABASE_URL="postgresql://user:password@ep-pooler.neon.tech/neondb?sslmode=require" npx tsx prisma/seed.ts
   ```

---

### Step 3.2: Real-time Collaboration Service (Render or Fly.io)

Because Vercel serverless functions have execution time limits and cannot maintain persistent stateful WebSockets, the Yjs collaboration hub is hosted on a continuous container.

#### Option A: Deploying on Render (Free Tier)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name:** `syncspace-collab`
   - **Environment:** `Node`
   - **Build Command:** `npm ci && npx prisma generate`
   - **Start Command:** `npm run collab:server`
   - **Instance Type:** `Free`
4. Set Environment Variables:
   - `DATABASE_URL`: Your Neon direct connection string.
   - `AUTH_SECRET`: Identical to the web app's `AUTH_SECRET`.
   - `COLLAB_PORT`: `10000` (Render assigns port 10000 by default; configure `PORT=10000` or `COLLAB_PORT=10000`).
5. Render will assign a public URL: `https://syncspace-collab.onrender.com`.
   - Your WebSocket URL is `wss://syncspace-collab.onrender.com`.

#### Option B: Deploying on Fly.io (Free Micro VM)
1. Initialize fly configuration in the root:
   ```bash
   fly launch --no-deploy
   ```
2. Configure `fly.toml` to run `npm run collab:server` exposing port `8080`.
3. Set secrets:
   ```bash
   fly secrets set DATABASE_URL="postgresql://..." AUTH_SECRET="..." COLLAB_PORT="8080"
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

### Step 3.3: Web Application Deployment (Vercel)

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
3. Import your `SyncSpace` repository.
4. Configure Project Settings:
   - **Framework Preset:** `Next.js`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm ci --legacy-peer-deps`
5. Configure Environment Variables in the Vercel dashboard:
   - `DATABASE_URL`: `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require`
   - `AUTH_SECRET`: (Generated 32-byte hex string)
   - `NEXT_PUBLIC_APP_URL`: `https://syncspace.vercel.app` (or your custom domain)
   - `NEXT_PUBLIC_COLLAB_WS_URL`: `wss://syncspace-collab.onrender.com`
6. Click **Deploy**. Vercel will build all 36 routes and output static & dynamic App Router endpoints.

---

## 4. Free-Tier Operational Constraints & Mitigations

### 1. Render Free Tier Spin-Down (Cold Starts)
- **Constraint:** Render free services enter sleep mode after 15 minutes of inactivity. The first user connecting after sleep may experience a 30-50 second delay before the WebSocket handshake succeeds.
- **SyncSpace Mitigation:**
  - SyncSpace includes a graceful local fallback in `collaborative-editor.tsx`. If the WebSocket is connecting or unavailable, users can still write locally with optimistic auto-saving to `/api/documents/[id]`.
  - Once the WebSocket awakens, Yjs CRDT diffs automatically reconcile local edits without losing a single keystroke.
  - To prevent sleep during presentations, configure a free monitor like [UptimeRobot](https://uptimerobot.com) to ping the HTTP health probe `/health` every 10 minutes.

### 2. Neon Database Connection Limits
- **Constraint:** Neon free-tier allows up to 20 concurrent connections.
- **SyncSpace Mitigation:**
  - Using the Neon **connection pooler** URL (`-pooler`) enables connection multiplexing via PgBouncer.
  - The collaboration server uses batched updates and periodic compaction (merging 50 `DocumentUpdate` rows into a single baseline), minimizing database load.

### 3. Vercel Serverless Function Execution Timeouts
- **Constraint:** Hobby tier functions time out at 15 seconds.
- **SyncSpace Mitigation:**
  - All heavy processing (CRDT aggregation, live awareness, long-lived subscriptions) is offloaded to the standalone collaboration server.
  - Next.js server actions and API route handlers perform bounded single-query lookups and return in < 50ms.

---

## 5. Production Health Checks & Verification

After deployment, verify the health of all systems using the following checklist:

1. **Web App Probe:**
   - Navigate to `https://<YOUR_APP_URL>/`
   - Confirm marketing page renders with correct OpenGraph meta tags and light/dark theme toggle.
2. **Authentication Flow:**
   - Sign in using `alice@syncspace.dev` / `Password123!` (or register a new user).
   - Check developer tools -> Application -> Cookies: Verify `syncspace_session` has `HttpOnly`, `SameSite=Lax`, and `Secure` attributes enabled.
3. **Real-time Dual-Client Synchronization:**
   - Open Document in Incognito or second browser with `bob@syncspace.dev`.
   - Verify presence avatars show both users active in the document header.
   - Type in Client A; verify instantaneous character-level convergence in Client B.
   - Verify cursor movements display real-time remote user names and colors.
4. **Disconnection Resilience:**
   - Disconnect Wi-Fi on Client A for 10 seconds while typing.
   - Observe editor badge transitioning to `Offline`.
   - Reconnect Wi-Fi; observe badge transitioning to `Syncing` -> `Saved`. Verify changes converge without conflict.

---

## 6. Disaster Recovery & Rollback Procedures

### Snapshot Rollback
In the event of accidental content deletion or document corruption, authorized editors can restore any past version directly from the UI:
1. Open document -> Click **History** in the top navigation bar.
2. Preview past revisions with timestamp and author attribution.
3. Click **Restore**. SyncSpace creates a non-destructive restoration point and broadcasts the restored CRDT state to all connected peers.

### Database Backup
Neon provides instant Point-In-Time Restore (PITR) and database branching:
- To create a point-in-time branch prior to major upgrades:
  ```bash
  neon branches create --name pre-upgrade-backup
  ```
- To dump a local backup:
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f syncspace_backup.dump
  ```
