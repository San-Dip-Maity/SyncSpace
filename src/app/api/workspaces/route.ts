import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { workspaceCreateSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/audit/logger";
import { WorkspaceRole } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    include: {
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
      _count: {
        select: {
          members: true,
          documents: { where: { isDeleted: false } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      description: w.description,
      myRole: w.members[0]?.role || WorkspaceRole.MEMBER,
      memberCount: w._count.members,
      documentCount: w._count.documents,
      createdAt: w.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = workspaceCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description } = result.data;
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        members: {
          create: {
            userId: user.id,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });

    await logAuditEvent({
      action: "WORKSPACE_CREATE",
      userId: user.id,
      workspaceId: workspace.id,
      metadata: { name: workspace.name },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
