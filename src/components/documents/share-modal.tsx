"use client";

import * as React from "react";
import { Share2, Copy, Check, Trash2, AlertTriangle, Shield, UserPlus, Users, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ShareLinkItem {
  id: string;
  token: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  requiresAuth: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface DocumentUserPermission {
  id: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR";
  email: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

export interface ShareData {
  owner?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  workspace?: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      role: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string | null;
      };
    }>;
  } | null;
  permissions: DocumentUserPermission[];
  shareLinks: ShareLinkItem[];
}

interface ShareModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ documentId, isOpen, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = React.useState<"people" | "links">("people");
  const [data, setData] = React.useState<ShareData>({ permissions: [], shareLinks: [] });

  // Direct Invite Form state
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"VIEWER" | "COMMENTER" | "EDITOR">("EDITOR");
  const [isInviting, setIsInviting] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  // Share Link Form state
  const [linkRole, setLinkRole] = React.useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER");
  const [requiresAuth, setRequiresAuth] = React.useState(true);
  const [expiresInDays, setExpiresInDays] = React.useState(7);
  const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const fetchShareData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed fetching share data:", err);
    }
  }, [documentId]);

  React.useEffect(() => {
    if (isOpen) {
      fetchShareData();
    }
  }, [isOpen, fetchShareData]);

  // Handle direct user invite
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (res.ok) {
        setInviteEmail("");
        await fetchShareData();
      } else {
        const errJson = await res.json();
        setInviteError(errJson.error || "Failed to grant access");
      }
    } catch {
      setInviteError("Network error while sharing");
    } finally {
      setIsInviting(false);
    }
  };

  // Handle generating a shareable link
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingLink(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: linkRole, requiresAuth, expiresInDays }),
      });

      if (res.ok) {
        await fetchShareData();
      }
    } catch (err) {
      console.error("Failed creating share link:", err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share?linkId=${linkId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchShareData();
      }
    } catch (err) {
      console.error("Failed revoking link:", err);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share?permissionId=${permissionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchShareData();
      }
    } catch (err) {
      console.error("Failed removing permission:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" />
            <span>Share & Access Controls</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage who can view, comment, and edit this document, or create secure share links.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex border-b border-border gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("people")}
            className={`pb-2 px-1 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === "people"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>People With Access ({1 + (data.permissions?.length || 0)})</span>
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`pb-2 px-1 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === "links"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Share Links ({data.shareLinks?.length || 0})</span>
          </button>
        </div>

        {activeTab === "people" && (
          <div className="space-y-4">
            {/* Direct User Share Form */}
            <form onSubmit={handleInviteUser} className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 text-xs h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "VIEWER" | "COMMENTER" | "EDITOR")}
                  className="text-xs h-8 px-2 rounded-md border border-border bg-background"
                >
                  <option value="EDITOR">Can Edit</option>
                  <option value="COMMENTER">Can Comment</option>
                  <option value="VIEWER">Can View</option>
                </select>
                <Button type="submit" size="sm" className="h-8 gap-1 text-xs font-medium" disabled={isInviting}>
                  <UserPlus className="h-3 w-3" />
                  <span>Share</span>
                </Button>
              </div>
              {inviteError && (
                <p className="text-[11px] text-destructive">{inviteError}</p>
              )}
            </form>

            {/* List of People with Access */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {/* Document Owner */}
              {data.owner && (
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="h-7 w-7">
                      {data.owner.avatarUrl && <AvatarImage src={data.owner.avatarUrl} />}
                      <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                        {data.owner.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{data.owner.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{data.owner.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 font-bold">
                    Owner
                  </Badge>
                </div>
              )}

              {/* Direct Permissions */}
              {data.permissions?.map((p) => {
                const displayName = p.user?.name || p.email || "Invited User";
                const displayEmail = p.user?.email || p.email;

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-7 w-7">
                        {p.user?.avatarUrl && <AvatarImage src={p.user.avatarUrl} />}
                        <AvatarFallback className="text-[10px] font-bold">
                          {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] h-5 font-medium">
                        {p.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => handleRemovePermission(p.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove access"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Workspace General Access Note */}
              {data.workspace && (
                <div className="p-2.5 rounded-md bg-muted/15 border border-dashed border-border text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Workspace members ({data.workspace.members?.length || 0}) have default editor access.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-4">
            {/* Create Link Form */}
            <form onSubmit={handleCreateLink} className="space-y-3 rounded-lg border border-border bg-muted/20 p-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">Link Role</label>
                  <select
                    value={linkRole}
                    onChange={(e) => setLinkRole(e.target.value as "VIEWER" | "COMMENTER" | "EDITOR")}
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

                <Button type="submit" size="sm" className="h-8 text-xs font-medium" disabled={isGeneratingLink}>
                  Create Link
                </Button>
              </div>

              {!requiresAuth && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Public Link:</strong> Anyone on the internet with this link can access the document without an account.
                  </span>
                </div>
              )}
            </form>

            {/* Existing Active Links */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Active Links ({data.shareLinks?.length || 0})
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {!data.shareLinks || data.shareLinks.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No active share links. Generate one above.
                  </div>
                ) : (
                  data.shareLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-card text-xs shadow-xs"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-bold">
                            {link.role}
                          </Badge>
                          {link.requiresAuth ? (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Shield className="h-3 w-3 text-emerald-500" /> Auth required
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-500">Public</span>
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
                          onClick={() => handleCopyLink(link.token)}
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
                          onClick={() => handleRevokeLink(link.id)}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
