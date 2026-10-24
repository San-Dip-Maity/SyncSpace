import { NextResponse } from "next/server";
import { getCurrentUser, getSession, createSessionToken } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, token: null }, { status: 401 });
  }

  const session = await getSession();
  const token = session ? await createSessionToken(session) : null;

  return NextResponse.json({ user, token });
}
