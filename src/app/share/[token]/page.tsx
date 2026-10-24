import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getSession, createSessionToken } from "@/lib/auth/session";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedDocumentView } from "@/components/documents/shared-document-view";

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

  const session = await getSession();
  const collabToken = session ? await createSessionToken(session) : null;

  const currentUserObj = user
    ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl, isGuest: false }
    : {
        id: `guest-${token.slice(0, 8)}`,
        name: "Anonymous",
        avatarUrl: null,
        isGuest: true,
      };

  return (
    <SharedDocumentView
      document={{
        id: shareLink.document.id,
        title: shareLink.document.title,
        contentHtml: shareLink.document.contentHtml,
        workspace: { name: shareLink.document.workspace.name },
        creator: shareLink.document.creator,
      }}
      shareLink={{
        id: shareLink.id,
        role: shareLink.role,
        requiresAuth: shareLink.requiresAuth,
        expiresAt: shareLink.expiresAt,
      }}
      currentUser={currentUserObj}
      shareToken={token}
      collabToken={collabToken}
    />
  );
}
