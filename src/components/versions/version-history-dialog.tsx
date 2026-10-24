"use client";

import * as React from "react";
import { History, RotateCcw, Plus, Calendar, User as UserIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface VersionItem {
  id: string;
  versionNumber: number;
  title: string;
  label?: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  contentPreview: string;
}

interface VersionHistoryDialogProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionRestored: () => void;
  shareToken?: string | null;
}

export function VersionHistoryDialog({
  documentId,
  isOpen,
  onClose,
  onVersionRestored,
  shareToken,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = React.useState<VersionItem[]>([]);
  const [selectedVersion, setSelectedVersion] = React.useState<VersionItem | null>(null);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = React.useState("");
  const [isCreatingSnapshot, setIsCreatingSnapshot] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  const fetchVersions = React.useCallback(async () => {
    try {
      const url = `/api/documents/${documentId}/versions${shareToken ? `?shareToken=${shareToken}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        if (data.versions?.length > 0 && !selectedVersion) {
          setSelectedVersion(data.versions[0]);
        }
      }
    } catch (err) {
      console.error("Failed fetching versions:", err);
    }
  }, [documentId, shareToken, selectedVersion]);

  React.useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fetchVersions]);

  const handleRestore = async (versionNumber: number) => {
    if (!window.confirm(`Are you sure you want to restore Version ${versionNumber}? A new restore snapshot will be created.`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", versionNumber }),
      });

      if (res.ok) {
        onVersionRestored();
        onClose();
      }
    } catch (err) {
      console.error("Failed to restore version:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newSnapshotLabel.trim() || undefined }),
      });

      if (res.ok) {
        setNewSnapshotLabel("");
        setShowCreateForm(false);
        await fetchVersions();
      }
    } catch (err) {
      console.error("Failed to create snapshot:", err);
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary" />
                <span>Document Version History</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Inspect revision snapshots and restore earlier document states non-destructively.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Snapshot Milestone</span>
            </Button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateSnapshot} className="pt-3 flex gap-2">
              <Input
                placeholder="Snapshot label (e.g. Q4 Final Review)..."
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                className="h-8 text-xs"
                disabled={isCreatingSnapshot}
              />
              <Button type="submit" size="sm" className="h-8 text-xs shrink-0" disabled={isCreatingSnapshot}>
                {isCreatingSnapshot ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Milestone"}
              </Button>
            </form>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 flex-1 min-h-[400px] overflow-hidden">
          {/* Versions List Column */}
          <div className="md:col-span-2 border-r border-border overflow-y-auto p-3 space-y-2 bg-muted/20">
            {versions.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No versions recorded yet.
              </div>
            ) : (
              versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedVersion?.id === v.id
                      ? "bg-background border-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-card border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-foreground">
                      Version {v.versionNumber}
                    </span>
                    {v.label && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {v.label}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(v.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <UserIcon className="h-3 w-3" />
                    <span className="truncate">{v.creator.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected Version Preview Column */}
          <div className="md:col-span-3 flex flex-col h-full overflow-hidden bg-background">
            {selectedVersion ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Version {selectedVersion.versionNumber} Snapshot Preview
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Created by {selectedVersion.creator.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRestore(selectedVersion.versionNumber)}
                    disabled={isRestoring}
                    className="gap-1.5 text-xs font-medium"
                  >
                    {isRestoring ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Restore Version</span>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 text-xs font-mono text-muted-foreground bg-muted/20 whitespace-pre-wrap leading-relaxed">
                  {selectedVersion.contentPreview || "Empty snapshot content."}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Select a version to inspect snapshot
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
