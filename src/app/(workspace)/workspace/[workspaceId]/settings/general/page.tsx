"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Trash2, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WorkspaceSettingsGeneralPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [myRole, setMyRole] = React.useState<string>("MEMBER");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadWorkspace() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.workspace.name);
          setDescription(data.workspace.description || "");
          setMyRole(data.workspace.myRole);
        }
      } catch (err) {
        console.error("Failed loading workspace:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspace();
  }, [workspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed saving workspace:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmation = window.prompt(
      `To permanently delete this workspace and all its documents, type the workspace name "${name}" below:`
    );

    if (confirmation !== name) {
      alert("Workspace name did not match. Deletion cancelled.");
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/workspace");
      }
    } catch (err) {
      console.error("Failed deleting workspace:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isOwner = myRole === "OWNER";
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage workspace identity, description, and administrative controls.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Workspace Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin || isSaving}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isAdmin || isSaving}
              rows={3}
              className="w-full text-xs p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <Check className="h-3.5 w-3.5" /> Saved!
                </span>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deleting this workspace permanently removes all member associations, folders, documents, version histories, and comments. This action cannot be reversed.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteWorkspace}
              className="gap-1.5 text-xs font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Workspace Permanently</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
