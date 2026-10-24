import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  FileText,
  Folder as FolderIcon,
  Users,
  Star,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await getCurrentUser();
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      documents: {
        where: { isDeleted: false, isArchived: false },
        include: {
          folder: { select: { id: true, name: true, color: true } },
          creator: { select: { id: true, name: true } },
          favorites: user ? { where: { userId: user.id } } : false,
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      },
      folders: {
        include: {
          _count: { select: { documents: { where: { isDeleted: false } } } },
        },
      },
      auditEvents: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const favoriteDocs = workspace.documents.filter((d) => d.favorites.length > 0);

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Workspace Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {workspace.name}
            </h1>
            <Badge variant="outline" className="text-xs">
              Dashboard
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {workspace.description || "Collaborative document workspace"} &bull;{" "}
            {workspace.members.length} team members
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/workspace/${workspace.id}/members`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span>Team ({workspace.members.length})</span>
            </Button>
          </Link>
          <Link href={`/workspace/${workspace.id}/documents`}>
            <Button size="sm" className="gap-1.5 text-xs font-medium">
              <FileText className="h-3.5 w-3.5" />
              <span>View Documents</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{workspace.documents.length}</div>
            <div className="text-xs text-muted-foreground">Active Documents</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FolderIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{workspace.folders.length}</div>
            <div className="text-xs text-muted-foreground">Document Folders</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{workspace.members.length}</div>
            <div className="text-xs text-muted-foreground">Collaborators</div>
          </div>
        </div>
      </div>

      {/* Favorites Section if any */}
      {favoriteDocs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Starred Documents</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favoriteDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/workspace/${workspace.id}/documents/${doc.id}`}
                className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {doc.title}
                  </span>
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Documents Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Recent Documents</span>
          </h2>
          <Link
            href={`/workspace/${workspace.id}/documents`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <span>All documents</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {workspace.documents.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-xs">No documents in this workspace yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {workspace.documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/workspace/${workspace.id}/documents/${doc.id}`}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
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

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(doc.updatedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Audit Trail */}
      {workspace.auditEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Recent Workspace Activity</span>
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-xs">
            {workspace.auditEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {event.user?.name || "System"}
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {event.action.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
