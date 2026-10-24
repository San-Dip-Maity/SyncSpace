import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewDocument, canEditDocument } from "@/lib/security/policies";
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

  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    include: {
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      title: v.title,
      label: v.label,
      createdAt: v.createdAt,
      creator: v.creator,
      contentPreview: Buffer.from(v.snapshotData).toString("utf-8").slice(0, 500),
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
  const canEdit = await canEditDocument(user.id, documentId);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden: Edit permission required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, versionNumber, label } = body;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Action: RESTORE earlier version
    if (action === "restore") {
      if (!versionNumber || typeof versionNumber !== "number") {
        return NextResponse.json({ error: "versionNumber is required for restore" }, { status: 400 });
      }

      const targetVersion = await prisma.documentVersion.findFirst({
        where: { documentId, versionNumber },
      });

      if (!targetVersion) {
        return NextResponse.json({ error: "Target version snapshot not found" }, { status: 404 });
      }

      const restoredContent = Buffer.from(targetVersion.snapshotData).toString("utf-8");

      // Count current versions to increment
      const count = await prisma.documentVersion.count({ where: { documentId } });
      const nextVersionNumber = count + 1;

      // Update document content and record restoration as a NEW version
      const updated = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id: documentId },
          data: { contentHtml: restoredContent },
        });

        await tx.documentVersion.create({
          data: {
            documentId,
            createdById: user.id,
            versionNumber: nextVersionNumber,
            title: `Restored to v${versionNumber}`,
            label: `Restored from v${versionNumber}`,
            snapshotData: targetVersion.snapshotData,
          },
        });

        return doc;
      });

      await logAuditEvent({
        action: "VERSION_RESTORE",
        userId: user.id,
        documentId,
        metadata: { fromVersion: versionNumber, newVersion: nextVersionNumber },
      });

      return NextResponse.json({
        document: updated,
        restoredVersion: versionNumber,
        newVersionNumber: nextVersionNumber,
      });
    }

    // Action: CREATE manual milestone snapshot
    const count = await prisma.documentVersion.count({ where: { documentId } });
    const nextVersionNumber = count + 1;

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId,
        createdById: user.id,
        versionNumber: nextVersionNumber,
        title: document.title,
        label: label || `Snapshot v${nextVersionNumber}`,
        snapshotData: Buffer.from(document.contentHtml || ""),
      },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await logAuditEvent({
      action: "VERSION_CREATE",
      userId: user.id,
      documentId,
      metadata: { versionNumber: nextVersionNumber, label: newVersion.label },
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error("Version error:", error);
    return NextResponse.json({ error: "Failed to process version request" }, { status: 500 });
  }
}
