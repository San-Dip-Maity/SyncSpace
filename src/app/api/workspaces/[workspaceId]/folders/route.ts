import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { folderCreateSchema } from "@/lib/validation/schemas";
import { canAccessWorkspace } from "@/lib/security/policies";

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

  const folders = await prisma.folder.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: {
          documents: { where: { isDeleted: false } },
          children: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      color: f.color,
      documentCount: f._count.documents,
      childCount: f._count.children,
      createdAt: f.createdAt,
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
    const result = folderCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const { name, parentId, color } = result.data;

    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, workspaceId },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent folder not found in workspace" }, { status: 400 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        workspaceId,
        name,
        parentId: parentId || null,
        color: color || null,
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
