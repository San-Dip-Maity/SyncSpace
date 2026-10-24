import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { documentCreateSchema } from "@/lib/validation/schemas";
import { canAccessWorkspace } from "@/lib/security/policies";
import { logAuditEvent } from "@/lib/audit/logger";
import { DocumentRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const hasAccess = await canAccessWorkspace(user.id, workspaceId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const favoriteOnly = searchParams.get("favorite") === "true";
  const trashOnly = searchParams.get("trash") === "true";
  const archivedOnly = searchParams.get("archived") === "true";
  const search = searchParams.get("search");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    workspaceId,
    isDeleted: trashOnly,
  };

  if (!trashOnly) {
    where.isArchived = archivedOnly;
  }

  if (folderId) {
    where.folderId = folderId === "root" ? null : folderId;
  }

  if (favoriteOnly) {
    where.favorites = {
      some: { userId: user.id },
    };
  }

  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { contentHtml: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      folder: {
        select: { id: true, name: true, color: true },
      },
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      favorites: {
        where: { userId: user.id },
        select: { id: true },
      },
      _count: {
        select: {
          comments: { where: { isResolved: false } },
          versions: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      folderId: doc.folderId,
      folder: doc.folder,
      isArchived: doc.isArchived,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      isFavorite: doc.favorites.length > 0,
      openCommentCount: doc._count.comments,
      versionCount: doc._count.versions,
      creator: doc.creator,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const hasAccess = await canAccessWorkspace(user.id, workspaceId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = documentCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const { title, folderId, contentHtml } = result.data;

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          workspaceId,
          createdById: user.id,
          folderId: folderId || null,
          title: title || "Untitled Document",
          contentHtml: contentHtml || "<p></p>",
          permissions: {
            create: {
              userId: user.id,
              role: DocumentRole.OWNER,
            },
          },
        },
      });

      // Initial version snapshot
      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          createdById: user.id,
          versionNumber: 1,
          title: doc.title,
          label: "Initial Draft",
          snapshotData: Buffer.from(doc.contentHtml || ""),
        },
      });

      return doc;
    });

    await logAuditEvent({
      action: "DOCUMENT_CREATE",
      userId: user.id,
      workspaceId,
      documentId: document.id,
      metadata: { title: document.title },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
