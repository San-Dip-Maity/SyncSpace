"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorToolbar } from "./editor-toolbar";
import { CollaboratorUser } from "./collaborator-avatars";

const USER_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

function getRandomColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export interface CollaborativeEditorProps {
  documentId: string;
  initialContentHtml: string;
  readOnly?: boolean;
  currentUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  shareToken?: string | null;
  onStatusChange?: (status: "synced" | "syncing" | "saved" | "offline") => void;
  onCollaboratorsChange?: (collaborators: CollaboratorUser[]) => void;
}

export function CollaborativeEditor({
  documentId,
  initialContentHtml,
  readOnly = false,
  currentUser,
  shareToken,
  onStatusChange,
  onCollaboratorsChange,
}: CollaborativeEditorProps) {
  const [ydoc] = React.useState(() => new Y.Doc());
  const [provider, setProvider] = React.useState<WebsocketProvider | null>(null);
  const userColor = React.useMemo(() => getRandomColor(currentUser.id || currentUser.name), [currentUser]);

  // Save fallback timer
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize Yjs WebSocket Provider
  React.useEffect(() => {
    let wsProvider: WebsocketProvider | null = null;
    const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:3001";

    try {
      wsProvider = new WebsocketProvider(wsUrl, documentId, ydoc, {
        params: shareToken ? { shareToken } : {},
      });

      // Set user awareness state
      wsProvider.awareness.setLocalStateField("user", {
        name: currentUser.name,
        color: userColor,
        avatarUrl: currentUser.avatarUrl,
      });

      wsProvider.on("status", ({ status }: { status: string }) => {
        if (status === "connected") {
          onStatusChange?.("synced");
        } else if (status === "connecting") {
          onStatusChange?.("syncing");
        } else {
          onStatusChange?.("offline");
        }
      });

      wsProvider.on("sync", (isSynced: boolean) => {
        if (isSynced) {
          onStatusChange?.("synced");
        }
      });

      // Track active collaborators in room
      const handleAwarenessChange = () => {
        const states = wsProvider!.awareness.getStates();
        const collaborators: CollaboratorUser[] = [];

        states.forEach((state, clientId) => {
          if (state.user && state.user.name) {
            collaborators.push({
              clientId,
              name: state.user.name,
              color: state.user.color || "#3b82f6",
              avatarUrl: state.user.avatarUrl,
            });
          }
        });

        onCollaboratorsChange?.(collaborators);
      };

      wsProvider.awareness.on("change", handleAwarenessChange);
      setProvider(wsProvider);
    } catch (err) {
      console.warn("Realtime WebSocket provider unavailable, operating in local sync mode:", err);
      onStatusChange?.("offline");
    }

    return () => {
      if (wsProvider) {
        wsProvider.destroy();
      }
      ydoc.destroy();
    };
  }, [documentId, ydoc, currentUser, userColor, shareToken, onStatusChange, onCollaboratorsChange]);

  // Autosave to REST endpoint as fallback and for search/preview hydration
  const handleContentUpdate = React.useCallback(
    (html: string) => {
      if (readOnly) return;
      onStatusChange?.("syncing");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/documents/${documentId}${shareToken ? `?shareToken=${shareToken}` : ""}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentHtml: html }),
          });

          if (res.ok) {
            onStatusChange?.("saved");
          } else {
            onStatusChange?.("offline");
          }
        } catch {
          onStatusChange?.("offline");
        }
      }, 1500);
    },
    [documentId, readOnly, shareToken, onStatusChange]
  );

  // Initialize Tiptap Editor
  const editor = useEditor(
    {
      editable: !readOnly,
      content: initialContentHtml,
      extensions: [
        StarterKit.configure({
          history: provider ? false : undefined, // If Yjs is active, Yjs manages history
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline cursor-pointer",
          },
        }),
        Placeholder.configure({
          placeholder: "Type '/' for commands or write your document...",
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        ...(provider
          ? [
              Collaboration.configure({
                document: ydoc,
              }),
              CollaborationCursor.configure({
                provider,
                user: {
                  name: currentUser.name,
                  color: userColor,
                },
              }),
            ]
          : []),
      ],
      onUpdate: ({ editor: e }) => {
        handleContentUpdate(e.getHTML());
      },
    },
    [provider, readOnly]
  );

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border shadow-xs overflow-hidden">
      {!readOnly && <EditorToolbar editor={editor} disabled={readOnly} />}

      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 sm:py-10 max-w-4xl mx-auto w-full">
        {readOnly && (
          <div className="mb-4 rounded-md bg-muted/60 border border-border px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
            <span>You have viewer permissions for this document (Read Only).</span>
          </div>
        )}

        <EditorContent
          editor={editor}
          className="focus:outline-none min-h-[500px] text-foreground text-base leading-relaxed"
        />
      </div>
    </div>
  );
}
