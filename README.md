<div align="center">

# 🚀 SyncSpace

**Real-Time Collaborative Document Platform for Engineering & Product Teams**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Yjs CRDT](https://img.shields.io/badge/Collaboration-Yjs_CRDT-orange)](https://github.com/yjs/yjs)
[![Prisma 6](https://img.shields.io/badge/ORM-Prisma_6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_18-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-Vitest_%26_Playwright-success?logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*SyncSpace delivers Google Docs-caliber real-time concurrent editing paired with Linear-grade aesthetic calm and Notion-like document organization. Engineered with zero-trust domain authorization, mathematical CRDT convergence, and serverless-compatible resilience.*

---

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Pre-Seeded Demo Accounts](#-pre-seeded-demo-accounts)
- [Quick Start Guide](#-quick-start-guide)
- [Available Scripts](#-available-scripts)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Engineering Documentation](#-engineering-documentation)
- [Deployment on Free Tiers](#-deployment-on-free-tiers)
- [Security & Compliance](#-security--compliance)
- [License](#-license)

---

## 🌟 Overview

SyncSpace is a production-minded web application engineered to solve the complex challenges of real-time multi-user document collaboration. Unlike naive document editors that overwrite content on save, SyncSpace combines:

1. **Conflict-Free Replicated Data Types (CRDTs)** via [Yjs](https://github.com/yjs/yjs) to guarantee mathematical convergence across concurrent typists without merge locks.
2. **Ephemeral Presence Awareness** rendering remote cursor coordinates, text selections, and user colors with sub-50ms latency.
3. **Multi-Tenant Workspace & Folder Hierarchy** ensuring complete isolation of documents between organizations and teams.
4. **Fine-Grained Document ACLs** supporting Owner, Editor, Commenter, and Viewer roles with server-side validation.
5. **Non-Destructive Version History** preserving historical document revisions with instantaneous one-click rollbacks.
6. **Threaded Contextual Discussions** allowing teams to highlight text, post comments, reply in threads, and resolve topics.
7. **Production Hardening** with Argon2/Bcrypt password hashing, JOSE-signed HttpOnly session cookies, rate limiting, and strict input sanitization.

---

## 🏛 System Architecture

SyncSpace employs a decoupled, server-first architecture separating transactional web operations from stateful real-time synchronization:

```mermaid
graph TD
    subgraph Client Tier
        BrowserA["Client A (Alice)"]
        BrowserB["Client B (Bob)"]
    end

    subgraph Edge & Web Tier (Vercel)
        NextApp["Next.js 16 App Router"]
        ServerActions["Server Actions & Route Handlers"]
        AuthMiddleware["JWT Session & Domain Policies"]
    end

    subgraph Realtime Tier (Render / Fly.io)
        CollabServer["SyncSpace WebSocket Hub (Port 3001)"]
        YjsCRDT["Yjs Document Rooms & Awareness"]
        CompactionEngine["50-Update Compactor"]
    end

    subgraph Data Tier (PostgreSQL / Neon)
        PgPool["PgBouncer Connection Pool"]
        RelationalDB[("PostgreSQL 18 Database<br/>- Users & Workspaces<br/>- Documents & Folders<br/>- Comments & Versions<br/>- Audit Events")]
        CRDTStorage[("DocumentUpdate (Binary CRDT Updates)")]
    end

    BrowserA -->|HTTPS / Next.js Server Components| NextApp
    BrowserB -->|HTTPS / Next.js Server Components| NextApp
    NextApp --> ServerActions
    ServerActions --> AuthMiddleware
    AuthMiddleware --> PgPool

    BrowserA <-->|WSS (Yjs Protocol + Room Auth)| CollabServer
    BrowserB <-->|WSS (Yjs Protocol + Room Auth)| CollabServer
    CollabServer --> YjsCRDT
    YjsCRDT --> CompactionEngine
    CompactionEngine --> CRDTStorage
    PgPool --> RelationalDB
    PgPool --> CRDTStorage
```

### Data Flow Highlights
- **Document Read:** Next.js Server Components fetch authorized document metadata directly from PostgreSQL.
- **Concurrent Editing:** The client connects over secure WebSockets (`wss://`) to the dedicated collaboration server, presenting its session cookie. Upon verifying room permissions, Yjs diff updates and cursor awareness packets are broadcast to peer clients and flushed durably to the `DocumentUpdate` table.
- **Compaction:** Once 50 incremental binary updates accumulate for a document, the server compresses them into a single unified snapshot, preventing database bloat.
- **Offline Fallback:** If the network is interrupted, local keystrokes are preserved in-memory and synchronized via REST fallback (`/api/documents/[id]`) until WebSocket connectivity automatically reconnects.

---

## ⚡ Key Features

| Capability | Engineering Implementation |
| :--- | :--- |
| **Real-Time Collaboration** | Yjs CRDTs + ProseMirror collaboration plugins. Concurrent keystrokes converge deterministically without data loss or race conditions. |
| **Collaborator Presence** | Ephemeral awareness protocol broadcasting remote user names, avatar colors, and real-time cursor positions. |
| **Rich-Text Formatting** | Tiptap 2.x editor with typography hierarchies (H1-H3), bold, italic, underline, strikethrough, blockquotes, code blocks, lists, and tables. |
| **Workspace Isolation** | Multi-tenant organization boundaries with role-based member management (Owner, Admin, Member). |
| **Hierarchical Folders** | Recursive tree navigation with parent-child relationship validation and cycle prevention. |
| **Granular Document Sharing** | Document-level permissions (Owner, Editor, Commenter, Viewer) overriding or extending workspace defaults. |
| **Secure Share Links** | Opaque tokenized links with SHA-256 database storage, optional expiration dates, and configurable access roles. |
| **Threaded Discussions** | Side-panel comment threads with nested replies, author attribution, and thread resolution states. |
| **Version History** | Snapshot capture with diff previews, author metadata, and non-destructive version restoration. |
| **Audit Logging** | Immutable server-side audit events recording document mutations, member additions, and permission updates. |
| **Dark / Light / System Mode** | First-class CSS variable theming with zero layout flash (`next-themes`) and WCAG 2.2 AA compliant contrast. |
| **Responsive Design** | Collapsible desktop sidebar transforming into a touch-friendly mobile drawer with clean viewport adaptation. |

---

## 🛠 Tech Stack

### Frontend & Application Layer
- **Framework:** Next.js 16.4.3 (App Router, Server Components, Route Handlers)
- **Runtime:** React 19.0.0
- **Language:** TypeScript 5.x (Strict mode enabled)
- **Styling:** Tailwind CSS v4.0 with semantic CSS variables
- **Component Primitives:** Radix UI (`@radix-ui/react-*`) + custom accessible components
- **Editor:** Tiptap 2.27 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-link`)
- **CRDT Engine:** `yjs`, `y-protocols`, `y-websocket`, `y-prosemirror`
- **Icons:** `lucide-react`
- **Form Validation:** `react-hook-form` + `zod`

### Backend, Realtime & Persistence
- **Database:** PostgreSQL (v14+ supported; local automated runner uses PostgreSQL 18.4)
- **ORM:** Prisma 6.19.3 with committed migrations
- **Authentication:** JOSE JWT (`HS256`), Bcrypt.js password hashing, `HttpOnly` `SameSite=Lax` cookies
- **Real-time Server:** Standalone Node.js WebSocket Server (`ws`, `y-websocket`) with database compaction
- **Security:** In-memory sliding-window rate limiting, `sanitize-html` content protection, strict CSP headers

### Tooling & Testing
- **Unit & Integration:** Vitest 4.0, `@testing-library/react`
- **End-to-End:** Playwright test runner
- **Code Quality:** ESLint 9, Prettier
- **Continuous Integration:** GitHub Actions (`.github/workflows/ci.yml`)

---

## 👥 Pre-Seeded Demo Accounts

SyncSpace includes a comprehensive synthetic seed script providing realistic workspaces, multi-user memberships, nested folders, rich documents, comment threads, and version snapshots.

All seeded accounts share the default development password:

> **Universal Password:** `Password123!`

| User | Email | Seeded Workspace Role | Document Permission |
| :--- | :--- | :--- | :--- |
| **Alice Vance** | `alice@syncspace.dev` | **Workspace Owner** | Full Owner on all team documents |
| **Bob Martinez** | `bob@syncspace.dev` | **Admin Member** | Editor on Engineering Spec |
| **Charlie Chen** | `charlie@syncspace.dev` | **Member** | Commenter on Engineering Spec |
| **Dana Patel** | `dana@syncspace.dev` | **Member** | Viewer on Engineering Spec |

> [!TIP]
> **Two-Client Real-Time Testing:** Open `http://localhost:3000` in your standard browser as Alice, and open an Incognito window as Bob. Open the document **"SyncSpace Engineering Specification"** in both windows to watch live cursor tracking and multi-user typing.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v20.x, v22.x, or v26.x
- **npm:** v10+
- **Linux, macOS, or WSL2 (Windows)**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/SyncSpace.git
cd SyncSpace
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```
Default `.env` values are pre-tuned for local execution:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54329/syncspace?sslmode=disable"
AUTH_SECRET="syncspace-super-secure-production-secret-min-32-chars-key-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_COLLAB_WS_URL="ws://localhost:3001"
COLLAB_PORT=3001
NODE_ENV="development"
```

### 3. Start Local PostgreSQL Database
SyncSpace includes an embedded PostgreSQL binary runner that requires **no Docker and no system root/sudo privileges**:
```bash
./scripts/pg.sh start
```
*(To inspect database status, run `./scripts/pg.sh status`. To stop, run `./scripts/pg.sh stop`.)*

### 4. Push Schema & Seed Synthetic Data
```bash
npm run db:push
npm run db:seed
```

### 5. Start the Application & Realtime Collaboration Hub
Open two terminal tabs:

**Tab 1: Next.js Web Application**
```bash
npm run dev
```

**Tab 2: Real-time WebSocket Hub**
```bash
npm run collab:server
```

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **`npm run dev`** | `next dev` | Starts Next.js development server on `http://localhost:3000` |
| **`npm run collab:server`** | `tsx src/server/collab-server.ts` | Launches the Yjs WebSocket real-time collaboration server on port `3001` |
| **`npm run build`** | `next build` | Generates the optimized production build across all 36 routes |
| **`npm start`** | `next start` | Runs the compiled Next.js production server |
| **`npm run lint`** | `next lint` | Executes ESLint 9 checks across all source directories |
| **`npm run test`** | `vitest run` | Runs the automated unit and integration test suite |
| **`npm run test:e2e`** | `playwright test` | Executes end-to-end multi-browser user journeys |
| **`npm run db:push`** | `prisma db push` | Synchronizes Prisma schema directly with the database |
| **`npm run db:migrate`** | `prisma migrate dev` | Generates and applies new database migrations |
| **`npm run db:seed`** | `tsx prisma/seed.ts` | Populates the database with realistic synthetic demo data |
| **`npm run db:studio`** | `prisma studio` | Opens the visual database management GUI |

---

## 🧪 Testing & Quality Verification

SyncSpace is backed by a multi-tiered automated testing suite:

### 1. Unit & Integration Tests (Vitest)
Validates input sanitization (XSS filtering), rate-limiting algorithms, Zod request schemas, and database constraint enforcement (tenant isolation, cascading deletions, snapshot restoration):
```bash
npm run test
```
*Current status:* **24 / 24 Tests Passing (100%)**

### 2. Linting & Type Checking
```bash
npm run lint
npx tsc --noEmit
```
*Current status:* **0 Errors, 0 Warnings**

### 3. Production Build Compilation
```bash
npm run build
```
*Current status:* **36 / 36 Routes compiled successfully (Static & Dynamic App Router)**

---

## 📚 Engineering Documentation

SyncSpace includes comprehensive architectural and security deliverables in the [`docs/`](./docs) directory:

- 🏗 **[Architecture Overview (`docs/architecture.md`)](./docs/architecture.md):** Deep-dive into component models, request lifecycles, CRDT convergence mechanics, and state machines.
- 🛡 **[Security Architecture (`docs/security.md`)](./docs/security.md):** Detailed analysis of authentication, authorization policies, session security, XSS mitigation, and rate limiting.
- 🎯 **[Threat Model (`docs/threat-model.md`)](./docs/threat-model.md):** STRIDE threat assessment, attack surfaces, mitigation strategies, and residual risks.
- 🗄 **[Database Strategy (`docs/database.md`)](./docs/database.md):** Entity-relationship diagrams, indexing strategies, audit event trails, and snapshot compaction policies.
- 🚢 **[Deployment Guide (`docs/deployment.md`)](./docs/deployment.md):** Free-tier hosting on Vercel, Neon PostgreSQL, and Render/Fly.io.

---

## 🌐 Deployment on Free Tiers

SyncSpace can be hosted completely free of charge with high availability:

1. **Frontend & Server Actions:** Deploy to **Vercel** (connect GitHub repository, add env vars).
2. **Database:** Deploy to **Neon PostgreSQL** (free tier includes 0.5 GB storage and PgBouncer connection pooling).
3. **Collaboration WebSocket Hub:** Deploy container or node process to **Render** (free Web Service) or **Fly.io** (free micro VM).
4. Run production migrations: `npx prisma migrate deploy`.

For full step-by-step instructions, see the **[Deployment Guide](./docs/deployment.md)**.

---

## 🔒 Security & Compliance

- **Zero-Trust Access Model:** All document queries and mutations re-validate user permissions server-side.
- **Cryptographic Protections:** Passwords hashed with Bcrypt (salt rounds 10); sessions signed with HS256 tokens using timing-safe comparisons.
- **Content Security Policy (CSP):** Strict script, frame, and connect-src policies preventing reflected and DOM-based XSS attacks.
- **Audit Trails:** Critical actions (workspace member removal, share link generation, version restoration) produce immutable `AuditEvent` records.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
