"use client";

import * as React from "react";
import { Share2, Copy, Check, Trash2, AlertTriangle, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ShareLinkItem {
  id: string;
  token: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  requiresAuth: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

interface ShareModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ documentId, isOpen, onClose }: ShareModalProps) {
  const [role, setRole] = React.useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER");
  const [requiresAuth, setRequiresAuth] = React.useState(true);
  const [expiresInDays, setExpiresInDays] = React.useState(7);
  const [shareLinks, setShareLinks] = React.useState<ShareLinkItem[]>([]);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchLinks = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share`);
      if (res.ok) {
        const data = await res.json();
        setShareLinks(data.shareLinks || []);
      }
    } catch (err) {
      console.error("Failed fetching share links:", err);
    }
  }, [documentId]);

  React.useEffect(() => {
    if (isOpen) {
      fetchLinks();
    }
  }, [isOpen, fetchLinks]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, requiresAuth, expiresInDays }),
      });

      if (res.ok) {
        await fetchLinks();
      }
    } catch (err) {
      console.error("Failed creating share link:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevoke = async (linkId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share?linkId=${linkId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchLinks();
      }
    } catch (err) {
      console.error("Failed revoking link:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" />
            <span>Share Document</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create time-bound, cryptographically secured share links with configurable permissions.
          </DialogDescription>
        </DialogHeader>

        {/* Create Link Form */}
        <form onSubmit={handleCreateLink} className="space-y-3 rounded-lg border border-border bg-muted/20 p-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "VIEWER" | "COMMENTER" | "EDITOR")}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="VIEWER">Can View</option>
                <option value="COMMENTER">Can Comment</option>
                <option value="EDITOR">Can Edit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">Expiration</label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={365}>1 Year</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresAuth}
                onChange={(e) => setRequiresAuth(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span className="text-foreground">Require user sign-in</span>
            </label>

            <Button type="submit" size="sm" className="h-8 text-xs font-medium" disabled={isLoading}>
              Generate Link
            </Button>
          </div>

          {!requiresAuth && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Anyone with this link can access this document without logging in.
              </span>
            </div>
          )}
        </form>

        {/* Existing Active Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Active Share Links ({shareLinks.length})</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {shareLinks.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No active share links. Generate one above.
              </div>
            ) : (
              shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-card text-xs shadow-xs"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold">
                        {link.role}
                      </Badge>
                      {link.requiresAuth && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Shield className="h-3 w-3 text-emerald-500" /> Auth required
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      Expires: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="iconSm"
                      onClick={() => handleCopy(link.token)}
                      title="Copy link to clipboard"
                    >
                      {copiedToken === link.token ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleRevoke(link.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Revoke share link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
