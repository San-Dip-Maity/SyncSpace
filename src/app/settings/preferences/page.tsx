"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Moon, Sun, Check, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between">
        <Link
          href="/workspace"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workspace</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 sm:p-10 space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Appearance &amp; Preferences</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Customize how SyncSpace looks on your display.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Color Theme
            </label>
            <p className="text-xs text-muted-foreground">
              Select your interface theme preference.
            </p>

            {mounted && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    theme === "light"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Sun className="h-5 w-5 text-amber-500" />
                    {theme === "light" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Light</div>
                    <div className="text-[11px] text-muted-foreground">High contrast day theme</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Moon className="h-5 w-5 text-blue-500" />
                    {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Dark</div>
                    <div className="text-[11px] text-muted-foreground">Restful night theme</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    theme === "system"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Monitor className="h-5 w-5 text-emerald-500" />
                    {theme === "system" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">System</div>
                    <div className="text-[11px] text-muted-foreground">Sync with OS setting</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
