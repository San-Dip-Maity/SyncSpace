"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, MessageSquare, Check, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { CollaboratorAvatars, CollaboratorUser } from "@/components/editor/collaborator-avatars";
import { CommentsPanel } from "@/components/comments/comments-panel";

import { DocumentRole } from "@prisma/client";

interface SharedDocumentViewProps {
  document: {
    id: string;
    title: string;
    contentHtml: string | null;
    workspace: { name: string };
    creator: { name: string; email: string };
  };
  shareLink: {
    id: string;
    role: DocumentRole;
    requiresAuth: boolean;
    expiresAt?: Date | null;
  };
  currentUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    isGuest: boolean;
  };
  shareToken: string;
  collabToken?: string | null;
}

export function SharedDocumentView({
  document,
  shareLink,
  currentUser,
  shareToken,
  collabToken,
}: SharedDocumentViewProps) {
  const [syncStatus, setSyncStatus] = React.useState<"synced" | "syncing" | "saved" | "offline">("syncing");
  const [collaborators, setCollaborators] = React.useState<CollaboratorUser[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [openCommentsCount, setOpenCommentsCount] = React.useState(0);

  const isReadOnly = shareLink.role === "VIEWER";

  // Fetch comments count for badge
  const fetchCommentsCount = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${document.id}/comments?shareToken=${shareToken}`);
      if (res.ok) {
        const data = await res.json();
        const unres = data.comments?.filter((c: { isResolved: boolean }) => !c.isResolved) || [];
        setOpenCommentsCount(unres.length);
      }
    } catch {
      // ignore
    }
  }, [document.id, shareToken]);

  React.useEffect(() => {
    fetchCommentsCount();
  }, [fetchCommentsCount]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header Bar */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs tracking-tight hidden sm:inline">SyncSpace</span>
          </Link>
          <span className="text-muted-foreground text-xs shrink-0">&bull;</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
            {document.title}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold shrink-0">
            {shareLink.role}
          </Badge>

          {/* Realtime Sync Status Indicator */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground ml-2 shrink-0">
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </span>
            )}
            {syncStatus === "syncing" && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Syncing</span>
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

        {/* Action Controls & Collaborators */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Collaborator Avatars */}
          <CollaboratorAvatars collaborators={collaborators} />

          {/* Comments Panel Trigger */}
          <Button
            variant={isCommentsOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="h-8 gap-1.5 text-xs font-medium relative"
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

          <ThemeToggle />

          {currentUser.isGuest ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-border">
              <Link href={`/sign-in?callbackUrl=/share/${shareToken}`}>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="h-8 text-xs font-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-xs font-medium text-muted-foreground pl-1 border-l border-border hidden sm:block">
              {currentUser.name}
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Workspace: <span className="font-medium text-foreground">{document.workspace.name}</span> &bull; Author: {document.creator.name}
            </p>
          </div>

          <div className="flex-1 min-h-[550px]">
            <CollaborativeEditor
              documentId={document.id}
              initialContentHtml={document.contentHtml || "<p></p>"}
              readOnly={isReadOnly}
              currentUser={{
                id: currentUser.id,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
              }}
              shareToken={shareToken}
              collabToken={collabToken}
              onStatusChange={setSyncStatus}
              onCollaboratorsChange={setCollaborators}
            />
          </div>
        </main>

        {/* Threaded Discussions Side Panel */}
        <CommentsPanel
          documentId={document.id}
          isOpen={isCommentsOpen}
          onClose={() => {
            setIsCommentsOpen(false);
            fetchCommentsCount();
          }}
          currentUserId={currentUser.id}
          shareToken={shareToken}
        />
      </div>
    </div>
  );
}
