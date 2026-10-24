import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await logAuditEvent({
        action: "AUTH_SIGN_OUT",
        userId: session.userId,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign-out error:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
