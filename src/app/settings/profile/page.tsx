import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ArrowLeft, User, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between">
        <Link href="/workspace" className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workspace</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 sm:p-10 space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <span>Profile Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal identity and account details across workspaces.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="text-lg font-bold">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-semibold text-foreground">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified Account</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={user.name}
                disabled
                className="w-full text-xs h-9 px-3 rounded-md border border-border bg-muted/40 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full text-xs h-9 px-3 rounded-md border border-border bg-muted/40 cursor-not-allowed"
              />
            </div>

            <div className="text-[11px] text-muted-foreground">
              Account created on {new Date(user.createdAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
