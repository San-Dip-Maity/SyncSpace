import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { searchQuerySchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rl = await rateLimit(`search:${user.id}:${ip}`, { limit: 30, windowMs: 60000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Search rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = searchQuerySchema.safeParse({
    query: searchParams.get("query") || "",
    folderId: searchParams.get("folderId") || undefined,
    limit: searchParams.get("limit") || 20,
    offset: searchParams.get("offset") || 0,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  }

  const { query, folderId, limit, offset } = parsed.data;

  // Search only documents in workspaces where the current user is an active member OR explicitly granted permission
  const documents = await prisma.document.findMany({
    where: {
      isDeleted: false,
      OR: [
        {
          workspace: {
            members: {
              some: { userId: user.id },
            },
          },
        },
        {
          permissions: {
            some: { userId: user.id },
          },
        },
      ],
      AND: [
        folderId ? { folderId } : {},
        {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { contentHtml: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      folder: { select: { id: true, name: true, color: true } },
      creator: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip: offset,
    take: limit,
  });

  return NextResponse.json({
    results: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      workspace: doc.workspace,
      folder: doc.folder,
      creator: doc.creator,
      updatedAt: doc.updatedAt,
      snippet: doc.contentHtml
        ? doc.contentHtml.replace(/<[^>]*>/g, " ").slice(0, 160).trim()
        : "",
    })),
    count: documents.length,
  });
}
