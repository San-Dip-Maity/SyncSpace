import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageDocument } from "@/lib/security/policies";
import { shareLinkCreateSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit/logger";
import { DocumentRole } from "@prisma/client";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const canManage = await canManageDocument(user.id, documentId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden: Owner rights required" }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
      permissions: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      shareLinks: {
        where: { isRevoked: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    owner: document.creator,
    workspace: {
      id: document.workspace.id,
      name: document.workspace.name,
      members: document.workspace.members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
      })),
    },
    permissions: document.permissions.map((p) => ({
      id: p.id,
      role: p.role,
      user: p.user,
      email: p.email || p.user?.email || null,
    })),
    shareLinks: document.shareLinks.map((s) => ({
      id: s.id,
      token: s.tokenHash,
      role: s.role,
      requiresAuth: s.requiresAuth,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const canManage = await canManageDocument(user.id, documentId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden: Owner rights required" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // 1. If email is provided -> Share with specific user / member
    if (body.email && typeof body.email === "string") {
      const email = body.email.toLowerCase().trim();
      const role = (body.role as DocumentRole) || DocumentRole.EDITOR;

      const targetUser = await prisma.user.findUnique({
        where: { email },
      });

      if (targetUser && targetUser.id === user.id) {
        return NextResponse.json({ error: "You are already the owner of this document" }, { status: 400 });
      }

      let permission;
      if (targetUser) {
        permission = await prisma.documentPermission.upsert({
          where: {
            documentId_userId: {
              documentId,
              userId: targetUser.id,
            },
          },
          create: {
            documentId,
            userId: targetUser.id,
            email: targetUser.email,
            role,
          },
          update: {
            role,
          },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        });
      } else {
        // User not yet registered, create pending email permission
        const existing = await prisma.documentPermission.findFirst({
          where: { documentId, email },
        });

        if (existing) {
          permission = await prisma.documentPermission.update({
            where: { id: existing.id },
            data: { role },
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          });
        } else {
          permission = await prisma.documentPermission.create({
            data: {
              documentId,
              email,
              role,
            },
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          });
        }
      }

      await logAuditEvent({
        action: "DOCUMENT_SHARE_USER",
        userId: user.id,
        documentId,
        metadata: { targetEmail: email, role },
      });

      return NextResponse.json({ permission }, { status: 201 });
    }

    // 2. Otherwise -> Generate Share Link
    const result = shareLinkCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const { role, requiresAuth, expiresInDays } = result.data;
    const token = crypto.randomBytes(20).toString("hex");

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        documentId,
        tokenHash: token,
        role,
        requiresAuth,
        expiresAt,
        createdById: user.id,
      },
    });

    await logAuditEvent({
      action: "DOCUMENT_SHARE_LINK_CREATE",
      userId: user.id,
      documentId,
      metadata: { role, requiresAuth, expiresAt },
    });

    return NextResponse.json({
      shareLink: {
        id: shareLink.id,
        token: shareLink.tokenHash,
        role: shareLink.role,
        requiresAuth: shareLink.requiresAuth,
        expiresAt: shareLink.expiresAt,
        shareUrl: `/share/${token}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create share error:", error);
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const canManage = await canManageDocument(user.id, documentId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden: Owner rights required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { permissionId, role } = body;

    if (!permissionId || !role) {
      return NextResponse.json({ error: "permissionId and role are required" }, { status: 400 });
    }

    const updated = await prisma.documentPermission.update({
      where: { id: permissionId },
      data: { role: role as DocumentRole },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ permission: updated });
  } catch (error) {
    console.error("Update permission error:", error);
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const canManage = await canManageDocument(user.id, documentId);
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden: Owner rights required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId");
  const permissionId = searchParams.get("permissionId");

  if (linkId) {
    await prisma.shareLink.update({
      where: { id: linkId },
      data: { isRevoked: true },
    });

    await logAuditEvent({
      action: "DOCUMENT_SHARE_LINK_REVOKE",
      userId: user.id,
      documentId,
      metadata: { linkId },
    });

    return NextResponse.json({ success: true });
  }

  if (permissionId) {
    await prisma.documentPermission.delete({
      where: { id: permissionId },
    });

    await logAuditEvent({
      action: "DOCUMENT_PERMISSION_DELETE",
      userId: user.id,
      documentId,
      metadata: { permissionId },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "linkId or permissionId is required" }, { status: 400 });
}
