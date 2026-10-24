"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Trash2, RotateCcw, AlertOctagon, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrashItem {
  id: string;
  title: string;
  deletedAt?: string | null;
  creator: { name: string };
}

export default function TrashPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [items, setItems] = React.useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTrash = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents?trash=true`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.documents || []);
      }
    } catch (err) {
      console.error("Failed fetching trash:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  React.useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: false }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to restore document:", err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this document? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to permanently delete:", err);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-destructive" />
          <span>Trash</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Items in trash can be restored or permanently removed from this workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <Trash2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Trash is empty</h3>
          <p className="text-xs text-muted-foreground">
            No deleted documents found in this workspace.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs divide-y divide-border overflow-hidden">
          {items.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground line-through opacity-80">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Deleted {doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString() : ""} &bull; Created by {doc.creator.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(doc.id)}
                  className="gap-1.5 text-xs h-8"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Restore</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePermanentDelete(doc.id)}
                  className="gap-1.5 text-xs h-8 text-destructive hover:bg-destructive/10"
                >
                  <AlertOctagon className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
