"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Star,
  Folder as FolderIcon,
  Clock,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentListItem {
  id: string;
  title: string;
  folderId?: string | null;
  folder?: { id: string; name: string; color?: string | null } | null;
  isFavorite: boolean;
  isArchived: boolean;
  openCommentCount: number;
  versionCount: number;
  creator: { id: string; name: string; avatarUrl?: string | null };
  updatedAt: string;
}

export default function DocumentLibraryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const currentFolderId = searchParams.get("folderId");

  const [documents, setDocuments] = React.useState<DocumentListItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (currentFolderId) q.set("folderId", currentFolderId);
      if (search.trim()) q.set("search", search.trim());

      const res = await fetch(`/api/workspaces/${workspaceId}/documents?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed fetching documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, currentFolderId, search]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateDocument = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          folderId: currentFolderId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/workspace/${workspaceId}/documents/${data.document.id}`);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
      setIsCreating(false);
    }
  };

  const handleToggleFavorite = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, isFavorite: data.isFavorite } : d))
        );
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleSoftDelete = async (docId: string) => {
    if (!window.confirm("Move this document to Trash?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true }),
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Documents
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse and organize all collaborative documents in this workspace.
          </p>
        </div>

        <Button
          onClick={handleCreateDocument}
          disabled={isCreating}
          className="gap-1.5 text-xs font-medium shadow-xs"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          <span>New Document</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter documents by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        {currentFolderId && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto">
            <span>Filtered by folder</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/workspace/${workspaceId}/documents`)}
              className="h-6 text-[11px] px-2"
            >
              Clear filter
            </Button>
          </div>
        )}
      </div>

      {/* Document Grid / Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No documents found</h3>
            <p className="text-xs text-muted-foreground">
              Get started by creating your first document in this workspace.
            </p>
          </div>
          <Button onClick={handleCreateDocument} size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Create Document
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group"
              >
                <Link
                  href={`/workspace/${workspaceId}/documents/${doc.id}`}
                  className="flex items-center gap-3 overflow-hidden flex-1"
                >
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
                          <FolderIcon
                            className="h-2.5 w-2.5 mr-1"
                            style={{ color: doc.folder.color || undefined }}
                          />
                          {doc.folder.name}
                        </Badge>
                      )}
                      {doc.openCommentCount > 0 && (
                        <span className="text-primary font-medium">
                          {doc.openCommentCount} comment{doc.openCommentCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      v{doc.versionCount} snapshots
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => handleToggleFavorite(doc.id)}
                    aria-label={doc.isFavorite ? "Unstar document" : "Star document"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        doc.isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/60"
                      }`}
                    />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="iconSm" aria-label="More options">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => router.push(`/workspace/${workspaceId}/documents/${doc.id}`)}>
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSoftDelete(doc.id)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
