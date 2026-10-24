import Link from "next/link";
import { Layers, ArrowLeft, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm">SyncSpace</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Notice: Draft Terms for Demonstration Purposes.</strong>
              <p>This document is a draft operational terms of service provided as an engineering reference. Consult qualified legal counsel before deploying commercial offerings.</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service (Draft)</h1>
          <p className="text-xs text-muted-foreground">Last updated: October 2026</p>

          <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-lg font-semibold text-foreground">1. User Accounts &amp; Security</h2>
            <p>Users must provide accurate information when registering an account. You are responsible for maintaining the confidentiality of your session tokens and credentials.</p>

            <h2 className="text-lg font-semibold text-foreground pt-4">2. Acceptable Use Policy</h2>
            <p>Users agree not to exploit vulnerabilities, bypass rate limits, inject malicious scripts via documents or comments, or attempt unauthorized tenant access.</p>

            <h2 className="text-lg font-semibold text-foreground pt-4">3. Collaborative Availability</h2>
            <p>While SyncSpace is engineered for sub-millisecond CRDT convergence and bounded offline recovery, availability is provided on an &quot;as-is&quot; basis within applicable hosting quotas.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
