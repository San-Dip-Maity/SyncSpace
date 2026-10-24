"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Generic simulated safe delay to prevent account enumeration
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    setIsSubmitted(true);
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
            Password Recovery
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your account email to receive a secure password reset link.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {isSubmitted ? (
            <div className="text-center space-y-3 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Check your email</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                If an account exists for <strong>{email}</strong>, we have sent password reset instructions.
              </p>
              <div className="pt-2">
                <Link href="/sign-in">
                  <Button variant="outline" size="sm" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send Recovery Link"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
