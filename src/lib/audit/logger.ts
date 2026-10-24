import prisma from "@/lib/db/prisma";

export type AuditAction =
  | "AUTH_SIGN_IN"
  | "AUTH_SIGN_UP"
  | "AUTH_SIGN_OUT"
  | "WORKSPACE_CREATE"
  | "WORKSPACE_UPDATE"
  | "WORKSPACE_INVITE"
  | "DOCUMENT_CREATE"
  | "DOCUMENT_UPDATE"
  | "DOCUMENT_DELETE"
  | "DOCUMENT_RESTORE"
  | "DOCUMENT_SHARE_LINK_CREATE"
  | "DOCUMENT_SHARE_LINK_REVOKE"
  | "COMMENT_CREATE"
  | "COMMENT_RESOLVE"
  | "VERSION_CREATE"
  | "VERSION_RESTORE";

export interface LogAuditOptions {
  action: AuditAction;
  userId?: string | null;
  workspaceId?: string | null;
  documentId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    const sanitizedMetadata = options.metadata
      ? redactSensitiveFields(options.metadata)
      : undefined;

    await prisma.auditEvent.create({
      data: {
        action: options.action,
        userId: options.userId || null,
        workspaceId: options.workspaceId || null,
        documentId: options.documentId || null,
        metadataJson: sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
        ipAddress: options.ipAddress || null,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[AUDIT] ${new Date().toISOString()} | Action: ${options.action} | User: ${
          options.userId || "anonymous"
        } | Doc: ${options.documentId || "none"}`
      );
    }
  } catch (err) {
    console.error("[AUDIT] Failed to record audit event:", err);
  }
}

function redactSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "token", "secret", "cookie", "authSecret", "tokenHash"];
  const copy: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      copy[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      copy[key] = redactSensitiveFields(val as Record<string, unknown>);
    } else {
      copy[key] = val;
    }
  }

  return copy;
}
