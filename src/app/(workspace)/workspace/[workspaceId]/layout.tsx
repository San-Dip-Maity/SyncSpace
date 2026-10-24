import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { workspaceId } = await params;

  // Check access to current workspace
  const currentMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!currentMembership) {
    redirect("/workspace");
  }

  // Fetch all user's workspaces
  const allMemberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  const workspaces = allMemberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    myRole: m.role,
  }));

  // Fetch workspace folders
  const folders = await prisma.folder.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: { documents: { where: { isDeleted: false } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const folderSummaries = folders.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    color: f.color,
    documentCount: f._count.documents,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSidebar
        currentWorkspace={{
          id: currentMembership.workspace.id,
          name: currentMembership.workspace.name,
          slug: currentMembership.workspace.slug,
          myRole: currentMembership.role,
        }}
        workspaces={workspaces}
        folders={folderSummaries}
        currentUser={{
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
      />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
