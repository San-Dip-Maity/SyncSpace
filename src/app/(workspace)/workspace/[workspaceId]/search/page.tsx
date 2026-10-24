"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, FileText, ArrowRight, Loader2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  workspace: { id: string; name: string };
  folder?: { name: string } | null;
  creator: { name: string };
  snippet: string;
  updatedAt: string;
}

export default function WorkspaceSearchPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setHasSearched(true);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-6">
      <div className="border-b border-border pb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <span>Search Documents</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Full-text search scoped strictly to documents you are authorized to access.
        </p>

        <div className="relative pt-2">
          <Search className="absolute left-3 top-5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or document text (e.g. CRDT, RFC, Roadmap)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
            autoFocus
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
          <Search className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">No matching documents</h3>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search terms or checking another workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/workspace/${workspaceId}/documents/${item.id}`}
              className="block p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </span>
                  {item.folder && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
                      {item.folder.name}
                    </Badge>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
              </div>

              {item.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2 font-mono bg-muted/30 p-2 rounded-md">
                  {item.snippet}
                </p>
              )}

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>By {item.creator.name}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
