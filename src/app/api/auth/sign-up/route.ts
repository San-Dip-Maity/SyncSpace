import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { signUpSchema } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/audit/logger";
import { ThemePreference, WorkspaceRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = await rateLimit(`auth:signup:${ip}`, { limit: 10, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid registration data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
    const uniqueSlug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

    // Create user, workspace, and welcome doc in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          preferences: {
            create: {
              theme: ThemePreference.SYSTEM,
            },
          },
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug: uniqueSlug,
          description: "Personal collaborative workspace",
          members: {
            create: {
              userId: user.id,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });

      await tx.document.create({
        data: {
          workspaceId: workspace.id,
          createdById: user.id,
          title: "👋 Welcome to SyncSpace!",
          contentHtml: `
            <h1>Welcome to SyncSpace!</h1>
            <p>SyncSpace is your team's real-time collaborative document platform.</p>
            <h2>🚀 Quick Highlights</h2>
            <ul>
              <li><strong>Real-time CRDT:</strong> Multiple collaborators can edit simultaneously with remote presence and cursors.</li>
              <li><strong>Version History:</strong> Create snapshots and restore earlier versions non-destructively.</li>
              <li><strong>Threaded Discussions:</strong> Add inline comments and resolve threads.</li>
            </ul>
          `.trim(),
        },
      });

      return user;
    });

    await logAuditEvent({
      action: "AUTH_SIGN_UP",
      userId: newUser.id,
      ipAddress: ip,
      metadata: { email: newUser.email },
    });

    await setSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
