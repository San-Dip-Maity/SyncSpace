import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageDocument } from "@/lib/security/policies";
import { shareLinkCreateSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit/logger";
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

  const shareLinks = await prisma.shareLink.findMany({
    where: { documentId, isRevoked: false },
    orderBy: { createdAt: "desc" },
  });

  const permissions = await prisma.documentPermission.findMany({
    where: { documentId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    shareLinks: shareLinks.map((s) => ({
      id: s.id,
      token: s.tokenHash,
      role: s.role,
      requiresAuth: s.requiresAuth,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),
    permissions: permissions.map((p) => ({
      id: p.id,
      role: p.role,
      user: p.user,
      email: p.email,
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
    console.error("Create share link error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
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
  if (!linkId) {
    return NextResponse.json({ error: "linkId is required" }, { status: 400 });
  }

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
