import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-bold text-xs">SyncSpace</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-xs text-muted-foreground">
            The document, workspace, or page you are looking for does not exist or has been moved.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button size="sm">Return to SyncSpace</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
