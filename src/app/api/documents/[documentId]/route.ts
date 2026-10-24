import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { documentUpdateSchema } from "@/lib/validation/schemas";
import { getDocumentAccess, canEditDocument, canManageDocument } from "@/lib/security/policies";
import { sanitizeContentHtml } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const shareToken = searchParams.get("shareToken");
  const { documentId } = await params;

  const access = await getDocumentAccess(user?.id || null, documentId, shareToken);
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      folder: { select: { id: true, name: true, color: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      workspace: { select: { id: true, name: true, slug: true } },
      favorites: user ? { where: { userId: user.id } } : false,
      _count: {
        select: {
          comments: true,
          versions: true,
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    document: {
      ...document,
      myRole: access.role,
      isFavorite: document.favorites ? document.favorites.length > 0 : false,
    },
  });
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
  const { searchParams } = new URL(req.url);
  const shareToken = searchParams.get("shareToken");

  const canEdit = await canEditDocument(user.id, documentId, shareToken);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden: Edit permissions required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = documentUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const updates = result.data;

    // If archiving or soft deleting, require OWNER role
    if (updates.isArchived !== undefined || updates.isDeleted !== undefined) {
      const canManage = await canManageDocument(user.id, documentId);
      if (!canManage) {
        return NextResponse.json({ error: "Forbidden: Owner rights required for archive/delete" }, { status: 403 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataToUpdate: any = {};
    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.folderId !== undefined) dataToUpdate.folderId = updates.folderId;
    if (updates.contentHtml !== undefined) {
      dataToUpdate.contentHtml = sanitizeContentHtml(updates.contentHtml);
    }
    if (updates.isArchived !== undefined) dataToUpdate.isArchived = updates.isArchived;
    if (updates.isDeleted !== undefined) {
      dataToUpdate.isDeleted = updates.isDeleted;
      dataToUpdate.deletedAt = updates.isDeleted ? new Date() : null;
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: dataToUpdate,
    });

    if (updates.isDeleted !== undefined) {
      await logAuditEvent({
        action: updates.isDeleted ? "DOCUMENT_DELETE" : "DOCUMENT_RESTORE",
        userId: user.id,
        documentId,
        workspaceId: updated.workspaceId,
      });
    } else {
      await logAuditEvent({
        action: "DOCUMENT_UPDATE",
        userId: user.id,
        documentId,
        workspaceId: updated.workspaceId,
        metadata: { title: updated.title },
      });
    }

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
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
    return NextResponse.json({ error: "Forbidden: Only owner can permanently delete" }, { status: 403 });
  }

  try {
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permanent delete document error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
