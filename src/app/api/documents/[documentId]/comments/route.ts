import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { commentCreateSchema } from "@/lib/validation/schemas";
import { canCommentDocument, canViewDocument, canManageDocument } from "@/lib/security/policies";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  const { documentId } = await params;
  const { searchParams } = new URL(req.url);
  const shareToken = searchParams.get("shareToken");

  const canView = await canViewDocument(user?.id || null, documentId, shareToken);
  if (!canView) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const comments = await prisma.comment.findMany({
    where: {
      documentId,
      parentId: null, // root comments
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      resolvedBy: {
        select: { id: true, name: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ comments });
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
  const { searchParams } = new URL(req.url);
  const shareToken = searchParams.get("shareToken");

  const canComment = await canCommentDocument(user.id, documentId, shareToken);
  if (!canComment) {
    return NextResponse.json({ error: "Forbidden: Comment permissions required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = commentCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const { content, parentId } = result.data;
    const cleanContent = sanitizePlainText(content);

    const comment = await prisma.comment.create({
      data: {
        documentId,
        authorId: user.id,
        content: cleanContent,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await logAuditEvent({
      action: "COMMENT_CREATE",
      userId: user.id,
      documentId,
      metadata: { commentId: comment.id, parentId: comment.parentId },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
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
  const canComment = await canCommentDocument(user.id, documentId);
  if (!canComment) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { commentId, isResolved, content } = body;

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.documentId !== documentId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (isResolved !== undefined) {
      updateData.isResolved = isResolved;
      updateData.resolvedAt = isResolved ? new Date() : null;
      updateData.resolvedById = isResolved ? user.id : null;
    }

    if (content !== undefined) {
      if (comment.authorId !== user.id) {
        return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 });
      }
      updateData.content = sanitizePlainText(content);
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    if (isResolved !== undefined) {
      await logAuditEvent({
        action: "COMMENT_RESOLVE",
        userId: user.id,
        documentId,
        metadata: { commentId, isResolved },
      });
    }

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
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
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment || comment.documentId !== documentId) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isOwner = await canManageDocument(user.id, documentId);
  if (comment.authorId !== user.id && !isOwner) {
    return NextResponse.json({ error: "Forbidden: Cannot delete other users' comments" }, { status: 403 });
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return NextResponse.json({ success: true });
}
