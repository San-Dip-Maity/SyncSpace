import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Layers, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();

  const shareLink = await prisma.shareLink.findUnique({
    where: { tokenHash: token },
    include: {
      document: {
        include: {
          creator: { select: { name: true, email: true } },
          workspace: { select: { name: true } },
        },
      },
    },
  });

  if (!shareLink || shareLink.isRevoked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Share Link Expired or Revoked</h1>
          <p className="text-xs text-muted-foreground">
            This document share link is no longer active. Please contact the document owner to request access.
          </p>
          <Link href="/">
            <Button variant="outline" size="sm">
              Return to SyncSpace Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Share Link Expired</h1>
          <p className="text-xs text-muted-foreground">
            This time-bound link expired on {new Date(shareLink.expiresAt).toLocaleDateString()}.
          </p>
          <Link href="/">
            <Button variant="outline" size="sm">
              Return to SyncSpace Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (shareLink.requiresAuth && !user) {
    redirect(`/sign-in?callbackUrl=/share/${token}`);
  }

  const isReadOnly = shareLink.role === "VIEWER";
  const currentUserObj = user
    ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl }
    : { id: "anonymous-guest", name: "Guest Reviewer", avatarUrl: null };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs tracking-tight">SyncSpace</span>
          </Link>
          <span className="text-muted-foreground text-xs">&bull;</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
            {shareLink.document.title}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold">
            {shareLink.role} Access
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!user && (
            <Link href="/sign-up">
              <Button size="sm" className="h-8 text-xs font-medium">
                Sign Up
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Shared Document Canvas */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">{shareLink.document.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Shared from {shareLink.document.workspace.name} &bull; Created by {shareLink.document.creator.name}
          </p>
        </div>

        <div className="flex-1">
          <CollaborativeEditor
            documentId={shareLink.document.id}
            initialContentHtml={shareLink.document.contentHtml || "<p></p>"}
            readOnly={isReadOnly}
            currentUser={currentUserObj}
            shareToken={token}
          />
        </div>
      </main>
    </div>
  );
}
