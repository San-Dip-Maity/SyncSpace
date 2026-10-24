import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { WorkspaceRole } from "@prisma/client";

export default async function WorkspaceRedirectPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Find user's first workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
    orderBy: { joinedAt: "asc" },
  });

  if (membership?.workspaceId) {
    redirect(`/workspace/${membership.workspaceId}`);
  }

  // If user has no workspaces, create a default one
  const slugBase = user.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const uniqueSlug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

  const newWorkspace = await prisma.workspace.create({
    data: {
      name: `${user.name}'s Workspace`,
      slug: uniqueSlug,
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  redirect(`/workspace/${newWorkspace.id}`);
}
