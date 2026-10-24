import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewDocument } from "@/lib/security/policies";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const canView = await canViewDocument(user.id, documentId);
  if (!canView) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_documentId: {
        userId: user.id,
        documentId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ isFavorite: false });
  } else {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        documentId,
      },
    });
    return NextResponse.json({ isFavorite: true });
  }
}
