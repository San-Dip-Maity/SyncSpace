"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Share2,
  MessageSquare,
  History,
  Star,
  MoreVertical,
  Trash2,
  Check,
  CloudOff,
  Folder as FolderIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { CollaboratorAvatars, CollaboratorUser } from "@/components/editor/collaborator-avatars";
import { CommentsPanel } from "@/components/comments/comments-panel";
import { VersionHistoryDialog } from "@/components/versions/version-history-dialog";
import { ShareModal } from "@/components/documents/share-modal";

interface DocumentData {
  id: string;
  title: string;
  contentHtml: string;
  myRole: "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";
  isFavorite: boolean;
  isArchived: boolean;
  folderId?: string | null;
  folder?: { id: string; name: string; color?: string | null } | null;
  workspace: { id: string; name: string; slug: string };
  creator: { id: string; name: string; email: string };
}

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const documentId = params.documentId as string;

  const [document, setDocument] = React.useState<DocumentData | null>(null);
  const [currentUser, setCurrentUser] = React.useState<{ id: string; name: string; email: string; avatarUrl?: string | null } | null>(null);
  const [title, setTitle] = React.useState("");
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<"synced" | "syncing" | "saved" | "offline">("syncing");
  const [collaborators, setCollaborators] = React.useState<CollaboratorUser[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [openCommentsCount, setOpenCommentsCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load document and current user
  const fetchDocAndUser = React.useCallback(async () => {
    try {
      const [docRes, userRes] = await Promise.all([
        fetch(`/api/documents/${documentId}`),
        fetch("/api/auth/me"),
      ]);

      if (docRes.ok && userRes.ok) {
        const docData = await docRes.json();
        const userData = await userRes.json();
        setDocument(docData.document);
        setTitle(docData.document.title);
        setCurrentUser(userData.user);
      } else if (docRes.status === 403 || docRes.status === 404) {
        router.push(`/workspace/${workspaceId}/documents`);
      }
    } catch (err) {
      console.error("Failed loading document:", err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, workspaceId, router]);

  React.useEffect(() => {
    fetchDocAndUser();
  }, [fetchDocAndUser]);

  // Load comments count
  const fetchCommentsCount = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`);
      if (res.ok) {
        const data = await res.json();
        const unres = data.comments?.filter((c: { isResolved: boolean }) => !c.isResolved) || [];
        setOpenCommentsCount(unres.length);
      }
    } catch {
      // ignore
    }
  }, [documentId]);

  React.useEffect(() => {
    fetchCommentsCount();
  }, [fetchCommentsCount]);

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    if (!title.trim() || title === document?.title) return;

    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (document) {
        setDocument({ ...document, title: title.trim() });
      }
    } catch (err) {
      console.error("Failed to save title:", err);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (document) {
          setDocument({ ...document, isFavorite: data.isFavorite });
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleSoftDelete = async () => {
    if (!window.confirm("Move this document to Trash?")) return;
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true }),
      });
      if (res.ok) {
        router.push(`/workspace/${workspaceId}/documents`);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  if (isLoading || !document || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isReadOnly = document.myRole === "VIEWER";

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 select-none z-10">
        {/* Breadcrumbs & Editable Title */}
        <div className="flex items-center gap-2 overflow-hidden flex-1 max-w-xl">
          <Link
            href={`/workspace/${workspaceId}/documents`}
            className="text-xs text-muted-foreground hover:text-foreground truncate shrink-0"
          >
            {document.workspace.name}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />

          {document.folder && (
            <>
              <Link
                href={`/workspace/${workspaceId}/documents?folderId=${document.folder.id}`}
                className="text-xs text-muted-foreground hover:text-foreground truncate shrink-0 flex items-center gap-1"
              >
                <FolderIcon className="h-3 w-3" style={{ color: document.folder.color || undefined }} />
                <span>{document.folder.name}</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            </>
          )}

          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setTitle(document.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-background border border-primary text-foreground focus:outline-none w-full"
            />
          ) : (
            <button
              onClick={() => !isReadOnly && setIsEditingTitle(true)}
              disabled={isReadOnly}
              className="text-xs font-semibold text-foreground hover:bg-muted/60 px-1.5 py-0.5 rounded-sm truncate text-left transition-colors cursor-pointer"
              title={!isReadOnly ? "Click to rename document" : undefined}
            >
              {title}
            </button>
          )}

          {/* Sync Status Badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground ml-2 shrink-0">
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synced</span>
              </span>
            )}
            {syncStatus === "syncing" && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Syncing...</span>
              </span>
            )}
            {syncStatus === "saved" && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Saved</span>
              </span>
            )}
            {syncStatus === "offline" && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <CloudOff className="h-3 w-3" />
                <span>Offline</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Collaborator Avatars */}
          <CollaboratorAvatars collaborators={collaborators} />

          {/* Share Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Discussion Side Panel Trigger */}
          <Button
            variant={isCommentsOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="h-8 gap-1.5 text-xs relative"
            aria-label="Toggle discussions"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Comments</span>
            {openCommentsCount > 0 && (
              <Badge variant="default" className="h-4 px-1.5 text-[10px] ml-0.5">
                {openCommentsCount}
              </Badge>
            )}
          </Button>

          {/* Version History Trigger */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setIsVersionsOpen(true)}
            title="Version History"
            aria-label="Version History"
          >
            <History className="h-4 w-4" />
          </Button>

          {/* Favorite Toggle */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleToggleFavorite}
            title={document.isFavorite ? "Unstar document" : "Star document"}
            aria-label="Star document"
          >
            <Star
              className={`h-4 w-4 ${
                document.isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
              }`}
            />
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label="Document options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)} disabled={isReadOnly}>
                Rename Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsVersionsOpen(true)}>
                <History className="h-3.5 w-3.5 mr-2" /> Version History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSoftDelete} className="text-destructive" disabled={isReadOnly}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col">
          <CollaborativeEditor
            documentId={documentId}
            initialContentHtml={document.contentHtml || "<p></p>"}
            readOnly={isReadOnly}
            currentUser={currentUser}
            onStatusChange={setSyncStatus}
            onCollaboratorsChange={setCollaborators}
          />
        </div>

        {/* Comments Side Panel */}
        <CommentsPanel
          documentId={documentId}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          currentUserId={currentUser.id}
        />
      </div>

      {/* Version History Modal */}
      <VersionHistoryDialog
        documentId={documentId}
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        onVersionRestored={fetchDocAndUser}
      />

      {/* Share Document Modal */}
      <ShareModal
        documentId={documentId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
