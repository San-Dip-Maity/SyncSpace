"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sign in. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      if (data.primaryWorkspaceId) {
        router.push(`/workspace/${data.primaryWorkspaceId}`);
      } else {
        router.push("/workspace");
      }
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4 py-12 relative selection:bg-primary/20">
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              SyncSpace
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your collaborative workspaces and documents.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Work Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Quick Demo Logins for Evaluators */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("alice@syncspace.dev")}
                className="text-left rounded-md border border-border bg-muted/50 hover:bg-muted p-2.5 transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-foreground">
                  Alice (Lead)
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  alice@syncspace.dev
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("bob@syncspace.dev")}
                className="text-left rounded-md border border-border bg-muted/50 hover:bg-muted p-2.5 transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-foreground">
                  Bob (Staff Eng)
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  bob@syncspace.dev
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
