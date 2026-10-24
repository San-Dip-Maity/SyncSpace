"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layers,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  Star,
  Trash2,
  Users,
  Settings,
  Search,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  myRole: string;
}

export interface FolderSummary {
  id: string;
  name: string;
  parentId: string | null;
  color?: string | null;
  documentCount: number;
}

interface WorkspaceSidebarProps {
  currentWorkspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  folders: FolderSummary[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  onDocumentCreated?: (docId: string) => void;
}

export function WorkspaceSidebar({
  currentWorkspace,
  workspaces,
  folders,
  currentUser,
  onDocumentCreated,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isNewDocLoading, setIsNewDocLoading] = React.useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isNewWsOpen, setIsNewWsOpen] = React.useState(false);
  const [newWsName, setNewWsName] = React.useState("");

  const handleCreateDocument = async (folderId?: string) => {
    setIsNewDocLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          folderId: folderId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onDocumentCreated) {
          onDocumentCreated(data.document.id);
        } else {
          router.push(`/workspace/${currentWorkspace.id}/documents/${data.document.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    } finally {
      setIsNewDocLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (res.ok) {
        setNewFolderName("");
        setIsNewFolderOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWsName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewWsName("");
        setIsNewWsOpen(false);
        router.push(`/workspace/${data.workspace.id}`);
      }
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/sign-in");
    } catch {
      router.push("/sign-in");
    }
  };

  const navLinks = [
    {
      title: "All Documents",
      href: `/workspace/${currentWorkspace.id}/documents`,
      icon: FileText,
    },
    {
      title: "Favorites",
      href: `/workspace/${currentWorkspace.id}/favorites`,
      icon: Star,
    },
    {
      title: "Shared with Me",
      href: `/workspace/${currentWorkspace.id}/shared`,
      icon: Share2,
    },
    {
      title: "Trash",
      href: `/workspace/${currentWorkspace.id}/trash`,
      icon: Trash2,
    },
    {
      title: "Members",
      href: `/workspace/${currentWorkspace.id}/members`,
      icon: Users,
    },
    {
      title: "Settings",
      href: `/workspace/${currentWorkspace.id}/settings/general`,
      icon: Settings,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border select-none">
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {currentWorkspace.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">
                    {currentWorkspace.myRole}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === currentWorkspace.id && (
                  <span className="text-[10px] text-primary font-bold">Active</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsNewWsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick New Document Button */}
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          <Button
            size="sm"
            onClick={() => handleCreateDocument()}
            disabled={isNewDocLoading}
            className="col-span-4 h-8 text-xs font-medium gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Document</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/workspace/${currentWorkspace.id}/search`)}
            className="h-8 px-0 flex items-center justify-center"
            title="Search workspace"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="px-3 py-3 space-y-0.5">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href.includes("/documents") && pathname?.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{link.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Folders Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-border">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Folders
          </span>
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded-xs transition-colors cursor-pointer"
            title="Create folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {folders.length === 0 ? (
            <div className="text-[11px] text-muted-foreground/70 px-2 py-1">
              No folders created.
            </div>
          ) : (
            folders.map((f) => (
              <Link
                key={f.id}
                href={`/workspace/${currentWorkspace.id}/documents?folderId=${f.id}`}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderIcon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: f.color || undefined }}
                  />
                  <span className="truncate">{f.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                  {f.documentCount}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Current User & Theme Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity cursor-pointer">
              <Avatar className="h-7 w-7">
                {currentUser.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
                <AvatarFallback className="text-xs font-bold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-foreground truncate">{currentUser.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{currentUser.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings/preferences")}>
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>

      {/* Create Folder Modal */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Create New Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-3 pt-2">
            <Input
              placeholder="Folder name (e.g. Design Specs)..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewFolderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Modal */}
      <Dialog open={isNewWsOpen} onOpenChange={setIsNewWsOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Create Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-3 pt-2">
            <Input
              placeholder="Workspace name (e.g. Mobile Pod)..."
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewWsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Trigger */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="outline"
          size="iconSm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
