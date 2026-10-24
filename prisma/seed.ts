import { PrismaClient, WorkspaceRole, DocumentRole, ThemePreference } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SyncSpace database with synthetic demo data...");

  // Clean existing data
  await prisma.auditEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentUpdate.deleteMany();
  await prisma.documentPermission.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      email: "alice@syncspace.dev",
      name: "Alice Smith",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      preferences: {
        create: {
          theme: ThemePreference.SYSTEM,
          sidebarCollapsed: false,
        },
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@syncspace.dev",
      name: "Bob Jones",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      preferences: {
        create: {
          theme: ThemePreference.DARK,
          sidebarCollapsed: false,
        },
      },
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: "charlie@syncspace.dev",
      name: "Charlie Davis",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      preferences: {
        create: {
          theme: ThemePreference.LIGHT,
          sidebarCollapsed: false,
        },
      },
    },
  });

  const dana = await prisma.user.create({
    data: {
      email: "dana@syncspace.dev",
      name: "Dana Lee",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      preferences: {
        create: {
          theme: ThemePreference.SYSTEM,
          sidebarCollapsed: false,
        },
      },
    },
  });

  console.log("Users created: Alice (Lead), Bob (Staff Eng), Charlie (Product), Dana (Viewer).");

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Engineering",
      slug: "acme-engineering",
      description: "Primary workspace for engineering RFCs, roadmaps, and specs.",
      members: {
        create: [
          { userId: alice.id, role: WorkspaceRole.OWNER },
          { userId: bob.id, role: WorkspaceRole.ADMIN },
          { userId: charlie.id, role: WorkspaceRole.MEMBER },
          { userId: dana.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  // Second Workspace
  const _labsWorkspace = await prisma.workspace.create({
    data: {
      name: "NextGen Product Labs",
      slug: "product-labs",
      description: "Incubation workspace for next generation features.",
      members: {
        create: [
          { userId: alice.id, role: WorkspaceRole.ADMIN },
          { userId: bob.id, role: WorkspaceRole.OWNER },
        ],
      },
    },
  });

  // 3. Create Folders
  const archFolder = await prisma.folder.create({
    data: {
      workspaceId: workspace.id,
      name: "Architecture & Specs",
      color: "#3b82f6",
    },
  });

  const roadmapFolder = await prisma.folder.create({
    data: {
      workspaceId: workspace.id,
      name: "Product Roadmaps",
      color: "#10b981",
    },
  });

  const securityFolder = await prisma.folder.create({
    data: {
      workspaceId: workspace.id,
      name: "Security & Compliance",
      color: "#f59e0b",
    },
  });

  // 4. Create Documents
  const docRfc = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      folderId: archFolder.id,
      createdById: alice.id,
      title: "RFC 042: Real-Time CRDT Document Architecture",
      contentHtml: `
        <h1>RFC 042: Real-Time CRDT Document Architecture</h1>
        <p><strong>Status:</strong> Approved | <strong>Author:</strong> Alice Smith</p>
        <hr />
        <h2>1. Context & Motivation</h2>
        <p>SyncSpace requires sub-100ms multi-user collaborative editing with strong eventual consistency, offline resilience, and zero data loss during temporary network disconnects.</p>
        <h2>2. Data Synchronization Model</h2>
        <p>We leverage <em>Yjs</em> (YATA CRDT algorithm) for document state replication. Each keystroke compiles into an incremental binary update broadcast over secure WebSockets.</p>
        <blockquote>"CRDTs provide mathematical convergence guarantees regardless of packet ordering or transmission latency."</blockquote>
        <h2>3. Durability & Snapshots</h2>
        <ul>
          <li><strong>Binary Updates:</strong> Buffered and persisted periodically to PostgreSQL.</li>
          <li><strong>Snapshot Compaction:</strong> Applied after every 100 updates to bound memory and startup latency.</li>
          <li><strong>Audit Trail:</strong> Key revisions are labeled and snapshot into immutable version records.</li>
        </ul>
      `.trim(),
      favorites: {
        create: [{ userId: alice.id }, { userId: bob.id }],
      },
    },
  });

  const _docRoadmap = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      folderId: roadmapFolder.id,
      createdById: bob.id,
      title: "2026 Platform Vision & Milestones",
      contentHtml: `
        <h1>2026 Platform Vision & Milestones</h1>
        <p>This document details the quarterly milestones for SyncSpace enterprise readiness.</p>
        <h2>Q1: Collaboration Core</h2>
        <p>Deliver conflict-free rich-text editing, remote collaborator presence, and document sharing.</p>
        <h2>Q2: Enterprise Governance</h2>
        <p>Granular RBAC, audit log export, and compliance data retention policies.</p>
      `.trim(),
    },
  });

  const docSecurity = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      folderId: securityFolder.id,
      createdById: alice.id,
      title: "Application Threat Model & Security Posture",
      contentHtml: `
        <h1>Application Threat Model & Security Posture</h1>
        <p>Security analysis for SyncSpace web application and collaboration WebSockets.</p>
        <h2>Threat Vectors Evaluated</h2>
        <ul>
          <li>Tenant boundary traversal and IDOR vulnerabilities.</li>
          <li>Malicious script injection via rich-text paste (Stored XSS).</li>
          <li>Unauthorized room joining on collaboration WebSocket endpoints.</li>
        </ul>
        <p>All endpoints enforce server-side Zod validation, token signing, and DOMPurify sanitization.</p>
      `.trim(),
    },
  });

  // 5. Create Comments
  const comment1 = await prisma.comment.create({
    data: {
      documentId: docRfc.id,
      authorId: bob.id,
      content: "Do we have a benchmark on memory overhead when accumulating 1,000+ incremental updates before snapshot compaction?",
      isResolved: false,
    },
  });

  await prisma.comment.create({
    data: {
      documentId: docRfc.id,
      authorId: alice.id,
      parentId: comment1.id,
      content: "Yes, Yjs binary updates average ~18 bytes per insert. 1,000 updates consume < 30KB. We snapshot after 200 updates anyway to keep initial connection sync under 15ms.",
      isResolved: false,
    },
  });

  await prisma.comment.create({
    data: {
      documentId: docSecurity.id,
      authorId: charlie.id,
      content: "Verified that SVG and iframe payloads in clipboard pastes are rejected by the sanitizer.",
      isResolved: true,
      resolvedAt: new Date(),
      resolvedById: alice.id,
    },
  });

  // 6. Create Version History
  await prisma.documentVersion.create({
    data: {
      documentId: docRfc.id,
      createdById: alice.id,
      versionNumber: 1,
      title: "RFC 042: Initial Draft",
      label: "v1.0-draft",
      snapshotData: Buffer.from(docRfc.contentHtml || ""),
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: docRfc.id,
      createdById: bob.id,
      versionNumber: 2,
      title: "RFC 042: Approved Architecture",
      label: "v2.0-approved",
      snapshotData: Buffer.from(docRfc.contentHtml || ""),
    },
  });

  // 7. Create Share Link
  const shareToken = crypto.randomBytes(16).toString("hex");
  await prisma.shareLink.create({
    data: {
      documentId: docRfc.id,
      tokenHash: shareToken,
      role: DocumentRole.VIEWER,
      requiresAuth: false,
      createdById: alice.id,
    },
  });

  // 8. Create Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: alice.id,
        action: "WORKSPACE_CREATE",
        metadataJson: JSON.stringify({ name: "Acme Engineering" }),
      },
      {
        workspaceId: workspace.id,
        documentId: docRfc.id,
        userId: alice.id,
        action: "DOCUMENT_CREATE",
        metadataJson: JSON.stringify({ title: docRfc.title }),
      },
      {
        workspaceId: workspace.id,
        documentId: docRfc.id,
        userId: bob.id,
        action: "COMMENT_CREATE",
        metadataJson: JSON.stringify({ commentId: comment1.id }),
      },
    ],
  });

  console.log("Database seeded successfully with demo users, workspaces, folders, documents, comments, and audit events!");
  console.log("Demo Credentials: alice@syncspace.dev / Password123!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
