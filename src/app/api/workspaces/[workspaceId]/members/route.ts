import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { invitationCreateSchema } from "@/lib/validation/schemas";
import { canAdminWorkspace, getWorkspaceMemberRole } from "@/lib/security/policies";
import { logAuditEvent } from "@/lib/audit/logger";
import { WorkspaceRole } from "@prisma/client";
import crypto from "crypto";

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
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const invitations = await prisma.invitation.findMany({
    where: {
      workspaceId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    invitations,
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
  const isAdmin = await canAdminWorkspace(user.id, workspaceId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin rights required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = invitationCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const { email, role } = result.data;

    // Check if target user already exists
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (targetUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: targetUser.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 409 });
      }

      // Add directly as member
      const newMember = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: targetUser.id,
          role: role as WorkspaceRole,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      await logAuditEvent({
        action: "WORKSPACE_INVITE",
        userId: user.id,
        workspaceId,
        metadata: { invitedEmail: email, role },
      });

      return NextResponse.json({ member: newMember, message: "User added to workspace" });
    }

    // Otherwise create invitation
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role: role as WorkspaceRole,
        tokenHash: token,
        expiresAt,
        invitedById: user.id,
      },
    });

    await logAuditEvent({
      action: "WORKSPACE_INVITE",
      userId: user.id,
      workspaceId,
      metadata: { invitedEmail: email, role },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      inviteLink: `/invite/${token}`,
    });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
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
  const isAdmin = await canAdminWorkspace(user.id, workspaceId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin rights required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");
  if (!targetUserId) {
    return NextResponse.json({ error: "Target userId required" }, { status: 400 });
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUserId,
      },
    },
  });

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (targetMember.role === WorkspaceRole.OWNER) {
    return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: targetUserId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
