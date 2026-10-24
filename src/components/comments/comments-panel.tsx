"use client";

import * as React from "react";
import { MessageSquare, Check, RotateCcw, Send, X, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface CommentItem {
  id: string;
  content: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  resolvedBy?: {
    id: string;
    name: string;
  } | null;
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  }>;
}

interface CommentsPanelProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  shareToken?: string | null;
}

export function CommentsPanel({
  documentId,
  isOpen,
  onClose,
  currentUserId,
  shareToken,
}: CommentsPanelProps) {
  const [tab, setTab] = React.useState<"open" | "resolved">("open");
  const [comments, setComments] = React.useState<CommentItem[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [replyTextMap, setReplyTextMap] = React.useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchComments = React.useCallback(async () => {
    try {
      const url = `/api/documents/${documentId}/comments${shareToken ? `?shareToken=${shareToken}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  }, [documentId, shareToken]);

  React.useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/comments${shareToken ? `?shareToken=${shareToken}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment("");
        await fetchComments();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReply = async (parentId: string) => {
    const text = replyTextMap[parentId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/comments${shareToken ? `?shareToken=${shareToken}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), parentId }),
      });

      if (res.ok) {
        setReplyTextMap((prev) => ({ ...prev, [parentId]: "" }));
        setActiveReplyId(null);
        await fetchComments();
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
    }
  };

  const handleToggleResolved = async (commentId: string, currentResolved: boolean) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, isResolved: !currentResolved }),
      });

      if (res.ok) {
        await fetchComments();
      }
    } catch (err) {
      console.error("Failed to toggle resolve:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchComments();
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  if (!isOpen) return null;

  const openComments = comments.filter((c) => !c.isResolved);
  const resolvedComments = comments.filter((c) => c.isResolved);
  const displayed = tab === "open" ? openComments : resolvedComments;

  return (
    <aside className="w-80 sm:w-96 border-l border-border bg-card flex flex-col h-full z-20 shadow-lg animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Discussions</h2>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close comments panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border px-4 py-1.5 gap-2 bg-muted/30">
        <button
          onClick={() => setTab("open")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
            tab === "open" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Open</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {openComments.length}
          </Badge>
        </button>
        <button
          onClick={() => setTab("resolved")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
            tab === "resolved" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Resolved</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {resolvedComments.length}
          </Badge>
        </button>
      </div>

      {/* New Comment Input Box */}
      <div className="p-3 border-b border-border bg-muted/15">
        <form onSubmit={handleCreateComment} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or discussion thread..."
            className="w-full h-20 text-xs p-2.5 rounded-md border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isLoading || !newComment.trim()} className="gap-1.5 text-xs">
              <Send className="h-3 w-3" />
              <span>Comment</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayed.length === 0 ? (
          <div className="text-center py-10 space-y-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-xs">
              {tab === "open" ? "No open discussions yet." : "No resolved discussions."}
            </p>
          </div>
        ) : (
          displayed.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3.5 space-y-3 transition-colors ${
                c.isResolved ? "bg-muted/30 border-border/60 opacity-80" : "bg-card border-border shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {c.author.avatarUrl && <AvatarImage src={c.author.avatarUrl} alt={c.author.name} />}
                    <AvatarFallback className="text-[10px]">
                      {c.author.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{c.author.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => handleToggleResolved(c.id, c.isResolved)}
                    title={c.isResolved ? "Reopen discussion" : "Resolve discussion"}
                    className={c.isResolved ? "text-amber-500" : "text-emerald-500"}
                  >
                    {c.isResolved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  {c.author.id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {c.content}
              </div>

              {c.isResolved && c.resolvedBy && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Resolved by {c.resolvedBy.name}</span>
                </div>
              )}

              {/* Thread Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="pl-3 border-l-2 border-border/80 space-y-2 mt-2 pt-1">
                  {c.replies.map((reply) => (
                    <div key={reply.id} className="text-xs space-y-1 bg-muted/40 p-2 rounded-md">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">{reply.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {!c.isResolved && (
                <div className="pt-1">
                  {activeReplyId === c.id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyTextMap[c.id] || ""}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateReply(c.id);
                          }
                        }}
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          onClick={() => setActiveReplyId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          onClick={() => handleCreateReply(c.id)}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(c.id)}
                      className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      Reply to thread
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
