"use client";

import * as React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>SyncSpace Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4 font-sans antialiased">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-2xl text-center space-y-5">
          <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A critical application error occurred. You can attempt to refresh the application state or return to home.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
