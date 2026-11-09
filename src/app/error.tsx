"use client";

import React, { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application client-side exception caught:", error);

    try {
      const isChunkError =
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("ChunkLoadError") ||
        error?.message?.includes("Failed to fetch") ||
        error?.name === "ChunkLoadError";

      if (isChunkError && typeof window !== "undefined") {
        const hasAutoReloaded = sessionStorage.getItem("wcm_chunk_autoreload");
        if (!hasAutoReloaded) {
          sessionStorage.setItem("wcm_chunk_autoreload", "true");
          window.location.reload();
        }
      }
    } catch {
      // Storage might be restricted
    }
  }, [error]);

  const handleManualReload = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("wcm_chunk_autoreload");
      } catch {}
      window.location.href = "/login";
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#06061a] text-white">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center space-y-6 shadow-2xl animate-fadeIn">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            Update Available
          </h2>
          <p className="text-xs text-indigo-200/70 leading-relaxed">
            A new version of the WCM Outreach platform is ready. Please reload the page to apply the latest updates.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleManualReload}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer min-h-11"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </div>
    </div>
  );
}

