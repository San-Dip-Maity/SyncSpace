"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please ensure your password meets all complexity requirements.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      router.push("/sign-in");
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
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
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start collaborating seamlessly with your team in real time.
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
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={isLoading}
              />
            </div>

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
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            {/* Password requirements checklist */}
            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5 border border-border/50">
              <div className="font-medium text-foreground text-[11px] uppercase tracking-wider mb-1">
                Password Requirements:
              </div>
              <div className={`flex items-center gap-2 ${hasLength ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                <Check className={`h-3.5 w-3.5 ${hasLength ? "opacity-100" : "opacity-30"}`} />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center gap-2 ${hasUpper ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                <Check className={`h-3.5 w-3.5 ${hasUpper ? "opacity-100" : "opacity-30"}`} />
                <span>One uppercase letter</span>
              </div>
              <div className={`flex items-center gap-2 ${hasLower ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                <Check className={`h-3.5 w-3.5 ${hasLower ? "opacity-100" : "opacity-30"}`} />
                <span>One lowercase letter</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                <Check className={`h-3.5 w-3.5 ${hasNumber ? "opacity-100" : "opacity-30"}`} />
                <span>One number (0-9)</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-medium"
              disabled={isLoading || !isPasswordValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
