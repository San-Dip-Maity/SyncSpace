import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncSpace — Real-Time Collaborative Document Platform",
  description:
    "A production-grade collaborative workspace platform for modern engineering and product teams. Real-time CRDT editing, presence, version recovery, and access controls.",
  keywords:
    "collaboration, real-time editor, CRDT, Yjs, Notion alternative, markdown documents, team workspace",
  authors: [{ name: "SyncSpace Engineering Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
