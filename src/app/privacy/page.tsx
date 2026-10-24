import Link from "next/link";
import { Layers, ArrowLeft, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function PrivacyPage() {
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
              <strong>Notice: Draft Policy for Demonstration Purposes.</strong>
              <p>This draft privacy policy is provided for architectural and portfolio demonstration purposes and does not constitute formal legal counsel. Prior to production commercial operation, retain certified legal counsel.</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy (Draft)</h1>
          <p className="text-xs text-muted-foreground">Last updated: October 2026</p>

          <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information required to operate a collaborative document workspace:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account credentials (name, email address, cryptographic password hash).</li>
              <li>Collaborative document content, binary Yjs CRDT edit vectors, and version snapshots.</li>
              <li>Workspace metadata, folder structures, and comment discussions.</li>
              <li>Audit logs and access telemetry (timestamp, action type, IP address).</li>
            </ul>

            <h2 className="text-lg font-semibold text-foreground pt-4">2. How Data Is Processed</h2>
            <p>Data is processed exclusively to deliver real-time collaboration, enforce tenant isolation, and ensure high availability across users and workspaces.</p>

            <h2 className="text-lg font-semibold text-foreground pt-4">3. Data Retention &amp; Deletion</h2>
            <p>Users may soft-delete documents or permanently purge workspace content. Collaboration update streams are compacted periodically to enforce bounded storage limits.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
