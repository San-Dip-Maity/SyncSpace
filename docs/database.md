# SyncSpace — Database Architecture & Schema Reference

## 1. Overview

SyncSpace uses PostgreSQL as its persistent relational database, accessed through Prisma ORM.

The schema comprises 14 primary models designed for strict multi-tenancy, relational integrity, soft-deletion recovery, and high-performance querying.

---

## 2. Entity Schema Reference

| Model | Purpose | Key Constraints & Indexes |
|---|---|---|
| `User` | Authenticated user profiles | Unique `email`, index on `email`. |
| `Workspace` | Multi-tenant organization boundaries | Unique `slug`, index on `slug`. |
| `WorkspaceMember` | User membership within workspace | Composite unique `[workspaceId, userId]`, indexed foreign keys. |
| `Folder` | Nested organizational folders | Cascading parent-child hierarchy, index on `[workspaceId, parentId]`. |
| `Document` | Document metadata and cached HTML | Indexes on `[workspaceId, isDeleted, isArchived]`, `folderId`, `createdById`. |
| `DocumentPermission`| Explicit user/email permission grants | Composite unique `[documentId, userId]`, indexed on `documentId`. |
| `DocumentUpdate` | Streaming binary Yjs CRDT edit chunks | Indexed on `[documentId, createdAt]`. |
| `DocumentVersion` | Milestone snapshots and recovery points | Indexed on `[documentId, versionNumber]`. |
| `Comment` | Threaded discussions and inline reviews | Indexed on `[documentId, isResolved]`, `parentId`. |
| `Invitation` | Workspace membership invitations | Unique `tokenHash`, index on `[workspaceId, email]`. |
| `ShareLink` | External share links with roles | Unique `tokenHash`, index on `documentId`. |
| `Favorite` | User document bookmarks | Composite unique `[userId, documentId]`. |
| `AuditEvent` | Immutable security audit log | Indexed on `[workspaceId, createdAt]`, `[documentId, createdAt]`. |
| `UserPreference` | Theme and sidebar preferences | Unique `userId`. |

---

## 3. Data Retention & Compaction Strategy

- **Soft Deletion:**
  - Setting `isDeleted: true` and `deletedAt: DateTime` preserves document records in the `trash` view.
  - Hard deletion (`DELETE`) is permitted only by workspace/document owners.
- **Yjs Binary Compaction:**
  - Keystrokes generate small incremental binary updates stored in `DocumentUpdate`.
  - When updates for a document exceed 50 entries, the collaboration hub compacts the entire Y.Doc state into a single compressed binary and prunes older records, maintaining bounded storage.
