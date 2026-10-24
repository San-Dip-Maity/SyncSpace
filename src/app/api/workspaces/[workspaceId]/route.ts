import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { workspaceUpdateSchema } from "@/lib/validation/schemas";
import { canAdminWorkspace, getWorkspaceMemberRole } from "@/lib/security/policies";
import { logAuditEvent } from "@/lib/audit/logger";
import { WorkspaceRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const role = await getWorkspaceMemberRole(user.id, workspaceId);
  if (!role) {
    return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: {
          members: true,
          documents: { where: { isDeleted: false } },
          folders: true,
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({
    workspace: {
      ...workspace,
      myRole: role,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const isAdmin = await canAdminWorkspace(user.id, workspaceId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin rights required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = workspaceUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: result.data,
    });

    await logAuditEvent({
      action: "WORKSPACE_UPDATE",
      userId: user.id,
      workspaceId,
      metadata: result.data,
    });

    return NextResponse.json({ workspace: updated });
  } catch (error) {
    console.error("Update workspace error:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const role = await getWorkspaceMemberRole(user.id, workspaceId);
  if (role !== WorkspaceRole.OWNER) {
    return NextResponse.json({ error: "Forbidden: Only workspace owner can delete" }, { status: 403 });
  }

  try {
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
