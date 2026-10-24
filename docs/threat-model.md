# SyncSpace — Threat Model

This document outlines the STRIDE security threat analysis conducted for SyncSpace.

## 1. Assets & Trust Boundaries

| Asset | Sensitivity | Description |
|---|---|---|
| **User Credentials & Sessions** | Critical | Passwords, JWT cookies, session states. |
| **Document Content & Versions** | High | Collaborative rich-text, CRDT updates, snapshot binaries. |
| **Tenant Boundaries** | High | Workspace membership, isolation between private organizations. |
| **Share Link Tokens** | Medium | Opaque tokens granting external read/edit permissions. |
| **Audit Logs** | Medium | Historical security events and user operational telemetry. |

---

## 2. Threat Analysis (STRIDE)

### A. Spoofing (Identity & Authenticity)
- **Threat:** Attacker attempts to forge JWT session cookies or hijack WebSocket connections.
- **Mitigation:**
  - JWTs are cryptographically signed with HMAC-SHA256 using server-only `AUTH_SECRET` (min 32 chars).
  - WebSockets re-verify the JWT signature and query Prisma for document room permissions upon connection.

### B. Tampering (Data Integrity)
- **Threat:** Malicious editor attempts to overwrite documents or inject stored XSS via clipboard pastes.
- **Mitigation:**
  - Content sanitization with `sanitize-html` strips dangerous tags (`script`, `iframe`, `object`) and URL schemes (`javascript:`).
  - CRDT updates converge mathematically; unauthorized viewers cannot emit binary updates to the collaboration room.

### C. Repudiation (Accountability)
- **Threat:** Disgruntled collaborator deletes workspace or documents and denies involvement.
- **Mitigation:**
  - Structured `AuditEvent` records capture user ID, IP address, timestamp, action name, and metadata.
  - Soft deletion preserves recoverable states in `trash`.

### D. Information Disclosure (Confidentiality)
- **Threat:** Attacker enumerates document IDs or accesses private documents from another workspace (IDOR).
- **Mitigation:**
  - Random UUIDv4 identifiers prevent sequential enumeration.
  - Deny-by-default domain policy checks verify workspace membership on all API routes and search queries.

### E. Denial of Service (Availability)
- **Threat:** Automated bot spams registration, login, search, or collaboration WebSocket endpoints.
- **Mitigation:**
  - Sliding-window rate limiters cap request frequency on auth and search.
  - Compaction prevents unbounded memory growth from thousands of incremental Yjs updates.

### F. Elevation of Privilege (Authorization Bypass)
- **Threat:** Viewer attempts to issue administrative share links or restore versions.
- **Mitigation:**
  - Role-based access control (`canManageDocument`, `canAdminWorkspace`) enforced server-side.
  - Frontend UI visibility is never trusted as an authorization mechanism.
