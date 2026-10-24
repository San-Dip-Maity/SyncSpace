import prisma from "@/lib/db/prisma";
import { DocumentRole, WorkspaceRole } from "@prisma/client";

export interface DocumentAccessResult {
  allowed: boolean;
  role: DocumentRole | null;
  reason?: string;
  isCreator: boolean;
  isWorkspaceAdmin: boolean;
}

/**
 * Evaluates document access permissions for a user.
 * Implements strict deny-by-default domain authorization.
 */
export async function getDocumentAccess(
  userId: string | null,
  documentId: string,
  shareToken?: string | null
): Promise<DocumentAccessResult> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      workspace: {
        include: {
          members: userId ? { where: { userId } } : false,
        },
      },
      permissions: userId ? { where: { userId } } : false,
    },
  });

  if (!document || (document.isDeleted && !shareToken)) {
    return { allowed: false, role: null, reason: "Document not found or deleted", isCreator: false, isWorkspaceAdmin: false };
  }

  // 1. If user is document creator -> OWNER
  if (userId && document.createdById === userId) {
    return { allowed: true, role: DocumentRole.OWNER, isCreator: true, isWorkspaceAdmin: false };
  }

  // 2. Check explicit DocumentPermission assigned directly to user
  if (userId && document.permissions && document.permissions.length > 0) {
    const perm = document.permissions[0];
    return {
      allowed: true,
      role: perm.role,
      isCreator: false,
      isWorkspaceAdmin: false,
    };
  }

  // 3. Check Workspace Membership
  if (userId && document.workspace.members && document.workspace.members.length > 0) {
    const member = document.workspace.members[0];
    const isWsAdmin = member.role === WorkspaceRole.OWNER || member.role === WorkspaceRole.ADMIN;

    // By default, members of the workspace get EDITOR access unless restricted
    return {
      allowed: true,
      role: isWsAdmin ? DocumentRole.OWNER : DocumentRole.EDITOR,
      isCreator: false,
      isWorkspaceAdmin: isWsAdmin,
    };
  }

  // 4. Check Share Link if provided
  if (shareToken) {
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        documentId,
        tokenHash: shareToken,
        isRevoked: false,
      },
    });

    if (shareLink) {
      if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
        return { allowed: false, role: null, reason: "Share link expired", isCreator: false, isWorkspaceAdmin: false };
      }

      if (shareLink.requiresAuth && !userId) {
        return { allowed: false, role: null, reason: "Authentication required for this share link", isCreator: false, isWorkspaceAdmin: false };
      }

      return {
        allowed: true,
        role: shareLink.role,
        isCreator: false,
        isWorkspaceAdmin: false,
      };
    }
  }

  return { allowed: false, role: null, reason: "Access denied", isCreator: false, isWorkspaceAdmin: false };
}

export async function canViewDocument(userId: string | null, documentId: string, shareToken?: string | null): Promise<boolean> {
  const access = await getDocumentAccess(userId, documentId, shareToken);
  return access.allowed;
}

export async function canEditDocument(userId: string | null, documentId: string, shareToken?: string | null): Promise<boolean> {
  const access = await getDocumentAccess(userId, documentId, shareToken);
  return access.allowed && (access.role === DocumentRole.OWNER || access.role === DocumentRole.EDITOR);
}

export async function canCommentDocument(userId: string | null, documentId: string, shareToken?: string | null): Promise<boolean> {
  const access = await getDocumentAccess(userId, documentId, shareToken);
  return (
    access.allowed &&
    (access.role === DocumentRole.OWNER ||
      access.role === DocumentRole.EDITOR ||
      access.role === DocumentRole.COMMENTER)
  );
}

export async function canManageDocument(userId: string | null, documentId: string): Promise<boolean> {
  if (!userId) return false;
  const access = await getDocumentAccess(userId, documentId);
  return access.allowed && access.role === DocumentRole.OWNER;
}

/**
 * Evaluates Workspace access and administrative rights
 */
export async function getWorkspaceMemberRole(userId: string | null, workspaceId: string): Promise<WorkspaceRole | null> {
  if (!userId) return null;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  return membership ? membership.role : null;
}

export async function canAccessWorkspace(userId: string | null, workspaceId: string): Promise<boolean> {
  const role = await getWorkspaceMemberRole(userId, workspaceId);
  return role !== null;
}

export async function canAdminWorkspace(userId: string | null, workspaceId: string): Promise<boolean> {
  const role = await getWorkspaceMemberRole(userId, workspaceId);
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
}
