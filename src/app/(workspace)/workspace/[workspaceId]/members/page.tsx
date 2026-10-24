"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Users, UserPlus, Trash2, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

interface InvitationItem {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  expiresAt: string;
}

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [invitations, setInvitations] = React.useState<InvitationItem[]>([]);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviteFeedback, setInviteFeedback] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);

  const fetchMembers = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed fetching members:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSending(true);
    setInviteFeedback(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteEmail("");
        setInviteFeedback(data.message || "Invitation created successfully!");
        await fetchMembers();
      } else {
        setInviteFeedback(data.error || "Failed to send invitation.");
      }
    } catch {
      setInviteFeedback("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Workspace Members</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage collaborators, assign roles, and issue workspace invitations.
          </p>
        </div>

        <Button onClick={() => setIsInviteOpen(true)} className="gap-1.5 text-xs font-medium">
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite Member</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Members Table */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Active Members ({members.length})
            </div>
            <div className="divide-y divide-border">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                      <AvatarFallback className="text-xs font-bold">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <span>{member.name}</span>
                        <Badge
                          variant={member.role === "OWNER" ? "default" : "secondary"}
                          className="text-[10px] h-4 px-1.5"
                        >
                          {member.role}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                    {member.role !== "OWNER" && (
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Pending Invitations ({invitations.length})
              </div>
              <div className="divide-y divide-border">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{inv.email}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {inv.role}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>Invite Collaborator</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Invite a teammate to collaborate in this workspace.
            </DialogDescription>
          </DialogHeader>

          {inviteFeedback && (
            <div className="rounded-md bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary">
              {inviteFeedback}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Teammate Email
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoFocus
                disabled={isSending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Workspace Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                className="w-full text-xs h-9 px-3 rounded-md border border-border bg-background"
                disabled={isSending}
              >
                <option value="MEMBER">Member (Create and edit authorized documents)</option>
                <option value="ADMIN">Admin (Manage members and workspace settings)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteOpen(false)}>
                Done
              </Button>
              <Button type="submit" size="sm" disabled={isSending || !inviteEmail.trim()}>
                {isSending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Send Invite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
