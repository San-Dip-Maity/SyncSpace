import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Star, FileText, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await getCurrentUser();
  const { workspaceId } = await params;

  if (!user) return null;

  const documents = await prisma.document.findMany({
    where: {
      workspaceId,
      isDeleted: false,
      favorites: {
        some: { userId: user.id },
      },
    },
    include: {
      folder: { select: { id: true, name: true, color: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          <span>Favorites</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Quickly access the documents you have starred in this workspace.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <Star className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">No starred documents</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Star documents while browsing or editing to keep them easily accessible here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs divide-y divide-border overflow-hidden">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspace/${workspaceId}/documents/${doc.id}`}
              className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>Created by {doc.creator.name}</span>
                    {doc.folder && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {doc.folder.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
