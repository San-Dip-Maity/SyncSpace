import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Share2, FileText, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function SharedDocumentsPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  // Documents where user has explicit permission assigned
  const permissions = await prisma.documentPermission.findMany({
    where: {
      userId: user.id,
      document: { isDeleted: false },
    },
    include: {
      document: {
        include: {
          workspace: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" />
          <span>Shared with Me</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Documents you have been explicitly granted permission to collaborate on.
        </p>
      </div>

      {permissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <Share2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">No shared documents</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            When team members share documents directly with you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs divide-y divide-border overflow-hidden">
          {permissions.map((perm) => (
            <Link
              key={perm.id}
              href={`/workspace/${perm.document.workspaceId}/documents/${perm.document.id}`}
              className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {perm.document.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>From {perm.document.workspace.name}</span>
                    <span>&bull;</span>
                    <span>Owner: {perm.document.creator.name}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold">
                      {perm.role}
                    </Badge>
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
