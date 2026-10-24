import Link from "next/link";
import {
  Layers,
  Sparkles,
  Users,
  History,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                SyncSpace
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#collaboration" className="hover:text-foreground transition-colors">
                CRDT Architecture
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/workspace">
                <Button size="sm" className="font-medium gap-1.5">
                  Enter Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="font-medium shadow-sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real-Time CRDT Document Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
              Where Engineering &amp; Product Teams{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                Think in Sync.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sub-millisecond collaborative editing powered by Yjs CRDTs, granular access controls, immutable version snapshots, and threaded discussions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/sign-in">
                <Button size="lg" className="w-full sm:w-auto font-medium gap-2 shadow-md">
                  <span>Try Interactive Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                  View Transparent Pricing
                </Button>
              </Link>
            </div>

            {/* Interactive Preview Mockup Card */}
            <div className="mt-12 rounded-xl border border-border bg-card shadow-2xl p-4 sm:p-6 text-left relative overflow-hidden max-w-4xl mx-auto">
              {/* Document Header Bar */}
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    RFC
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      RFC 042: Real-Time CRDT Document Architecture
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Saved &bull; Synced via WebSockets</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Collaborator Avatars */}
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full border-2 border-card bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-emerald-500/30">
                      AS
                    </div>
                    <div className="h-7 w-7 rounded-full border-2 border-card bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-blue-500/30">
                      BJ
                    </div>
                    <div className="h-7 w-7 rounded-full border-2 border-card bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-purple-500/30">
                      CD
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    3 Live
                  </span>
                </div>
              </div>

              {/* Document Body Mockup */}
              <div className="space-y-4 font-mono text-xs sm:text-sm text-foreground/90 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Interactive Editor Canvas with Multi-User Awareness</span>
                </div>
                <div className="space-y-2 font-sans text-sm">
                  <h3 className="text-lg font-bold text-foreground">
                    Conflict-Free Replicated Data Types (CRDTs)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    SyncSpace models every document revision as a peer-to-peer Yjs state vector. Unlike legacy locks or last-write-wins strategies, multiple concurrent edits converge deterministically across network boundaries.
                  </p>
                  <div className="inline-block relative">
                    <span className="bg-primary/20 px-1 py-0.5 rounded text-foreground font-medium">
                      Alice is editing section 3.2
                    </span>
                    <span className="absolute -top-3.5 right-0 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.2 rounded-xs shadow-xs">
                      Alice
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="py-20 border-t border-border bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Engineered for High-Reliability Collaboration
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Everything your team needs to capture ideas, write engineering specs, and maintain living project documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Sub-millisecond CRDT Sync
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Powered by Yjs and secure WebSockets. Experience true concurrent multi-cursor typing with mathematical convergence guarantees.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Live Collaborator Presence
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  See where team members are working in real time with color-coded cursors, selection tracking, and active collaborator badges.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Version History &amp; Restore
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Inspect revision snapshots, view labeled milestones, and restore earlier document states non-destructively at any time.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Granular Permissions &amp; Tenant Isolation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Strict multi-tenant security model. Enforce Owner, Editor, Commenter, and Viewer roles with time-bound, revocable share links.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Zero-Trust Security
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Server-side authorization policies, CSP headers, XSS sanitization via DOMPurify, and sliding-window rate limiting.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Threaded Discussions &amp; Comments
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keep context directly beside your text. Start comment threads, mention team members, and resolve discussions as consensus forms.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">SyncSpace</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy (Draft)
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service (Draft)
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
