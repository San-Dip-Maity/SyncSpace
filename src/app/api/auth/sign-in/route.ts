import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { signInSchema } from "@/lib/validation/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = await rateLimit(`auth:signin:${ip}`, { limit: 15, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = signInSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          take: 1,
        },
      },
    });

    // Constant-time like generic failure message to prevent user enumeration
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    await logAuditEvent({
      action: "AUTH_SIGN_IN",
      userId: user.id,
      ipAddress: ip,
      metadata: { email: user.email },
    });

    const primaryWorkspaceId = user.memberships[0]?.workspaceId || null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      primaryWorkspaceId,
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in." },
      { status: 500 }
    );
  }
}
