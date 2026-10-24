# SyncSpace — Security Architecture & Guidelines

## 1. Authentication & Session Security

- **Cryptographic Hashing:** User passwords are encrypted using `bcryptjs` with 12 rounds of salt. Plaintext passwords are never persisted or logged.
- **Session Tokens:** Stateless JWTs signed with `HS256` via `jose`. Tokens expire after 7 days.
- **Cookie Flags:**
  - `HttpOnly`: Prevents client-side script access via `document.cookie`, mitigating XSS credential theft.
  - `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF).
  - `Secure`: Transmitted only over HTTPS in production environments.
- **Account Enumeration Mitigation:** Generic authentication failure messages are returned for login errors, and simulated uniform delays are applied to recovery endpoints.

---

## 2. Authorization & Tenant Isolation

- **Deny-by-Default:** Every API route handler and server action enforces domain-level policy checks (`canViewDocument`, `canEditDocument`, `canManageDocument`, `canAccessWorkspace`, `canAdminWorkspace`).
- **Workspace Isolation:** Documents and folders are strictly partitioned by `workspaceId`. A user cannot view, edit, or search documents in a workspace unless they hold active membership.
- **Document Roles:**
  - `OWNER`: Full administrative rights, archive, delete, share-link generation, version restoration.
  - `EDITOR`: Rich-text editing, commenting, snapshot generation.
  - `COMMENTER`: Read-only text editing, full participation in discussion threads.
  - `VIEWER`: Read-only access, prohibited from submitting Yjs updates or comments.

---

## 3. Share Link Security

- **High-Entropy Tokens:** Share tokens are generated using 160-bit cryptographically secure pseudorandom numbers (`crypto.randomBytes(20)`).
- **Expiration & Revocation:** Share links support time bounds (1 day to 1 year) and immediate revocation flags.
- **Unauthenticated Access Warnings:** When an unauthenticated link is created, the UI displays an explicit security advisory.

---

## 4. Input Validation & XSS Defense

- **Zod Schema Enforcement:** All external payloads (query parameters, JSON bodies, route parameters) are validated against strict Zod schemas before reaching business logic.
- **HTML Sanitization:** User content is sanitized using `sanitize-html`. Disallowed tags, scripts, `<iframe>`, and dangerous protocols (`javascript:`, `data:`) are stripped.
- **Safe Link Schemes:** Only `http:`, `https:`, and `mailto:` protocols are permitted in hyperlinks.

---

## 5. Abuse Prevention & Rate Limiting

- **Sliding-Window Rate Limiting:**
  - Authentication endpoints (`/api/auth/sign-in`, `/api/auth/sign-up`): 10–15 attempts per minute per IP.
  - Search endpoint (`/api/search`): 30 queries per minute per user/IP.
- **Sensitive Log Redaction:** Structured logger automatically masks keys matching `password`, `token`, `secret`, `cookie`, or `authSecret`.

---

## 6. HTTP Security Headers

Configured in `next.config.ts`:
- `Content-Security-Policy`: Restricts scripts, objects, frames, and WebSocket connect targets.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer token leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Disables unneeded hardware APIs.
