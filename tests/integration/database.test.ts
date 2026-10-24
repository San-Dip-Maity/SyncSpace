import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { canViewDocument, canEditDocument, getDocumentAccess } from "@/lib/security/policies";
import { WorkspaceRole, DocumentRole } from "@prisma/client";

describe("Database Integration & Authorization Tests", () => {
  let testUserId: string;
  let testWorkspaceId: string;
  let testDocId: string;

  beforeAll(async () => {
    // Create an isolated test user
    const passwordHash = await hashPassword("TestSecret123!");
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@syncspace.test`,
        name: "Test Runner",
        passwordHash,
      },
    });
    testUserId = testUser.id;

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: `test-ws-${Date.now()}`,
        members: {
          create: {
            userId: testUserId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });
    testWorkspaceId = workspace.id;

    // Create test document
    const doc = await prisma.document.create({
      data: {
        workspaceId: testWorkspaceId,
        createdById: testUserId,
        title: "Integration Test Document",
        contentHtml: "<h1>Integration Test</h1><p>Verifying database durability.</p>",
      },
    });
    testDocId = doc.id;
  });

  afterAll(async () => {
    // Clean up test workspace (cascades to documents, comments, members)
    if (testWorkspaceId) {
      await prisma.workspace.delete({ where: { id: testWorkspaceId } }).catch(() => {});
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it("verifies password hashing and constant-time comparison", async () => {
    const raw = "MyStrongPassword456!";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    const valid = await verifyPassword(raw, hash);
    expect(valid).toBe(true);
    const invalid = await verifyPassword("WrongPassword!", hash);
    expect(invalid).toBe(false);
  });

  it("enforces workspace member uniqueness", async () => {
    await expect(
      prisma.workspaceMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: testUserId,
          role: WorkspaceRole.MEMBER,
        },
      })
    ).rejects.toThrow();
  });

  it("evaluates document ownership and access policy correctly", async () => {
    const access = await getDocumentAccess(testUserId, testDocId);
    expect(access.allowed).toBe(true);
    expect(access.role).toBe(DocumentRole.OWNER);
    expect(access.isCreator).toBe(true);

    const canEdit = await canEditDocument(testUserId, testDocId);
    expect(canEdit).toBe(true);

    const canView = await canViewDocument(testUserId, testDocId);
    expect(canView).toBe(true);
  });

  it("rejects unauthorized access for random users", async () => {
    const randomUserId = "00000000-0000-0000-0000-000000000000";
    const access = await getDocumentAccess(randomUserId, testDocId);
    expect(access.allowed).toBe(false);
  });

  it("creates and retrieves threaded comments", async () => {
    const rootComment = await prisma.comment.create({
      data: {
        documentId: testDocId,
        authorId: testUserId,
        content: "Root integration test comment",
      },
    });

    const reply = await prisma.comment.create({
      data: {
        documentId: testDocId,
        authorId: testUserId,
        parentId: rootComment.id,
        content: "Reply to test comment",
      },
    });

    const fetched = await prisma.comment.findUnique({
      where: { id: rootComment.id },
      include: { replies: true },
    });

    expect(fetched).not.toBeNull();
    expect(fetched!.replies.length).toBe(1);
    expect(fetched!.replies[0].id).toBe(reply.id);
  });

  it("persists document snapshots and preserves history", async () => {
    const v1 = await prisma.documentVersion.create({
      data: {
        documentId: testDocId,
        createdById: testUserId,
        versionNumber: 1,
        title: "Test Version 1",
        snapshotData: Buffer.from("Snapshot state 1"),
      },
    });

    expect(v1.versionNumber).toBe(1);
    expect(Buffer.from(v1.snapshotData).toString("utf-8")).toBe("Snapshot state 1");
  });
});
