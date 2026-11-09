"use client";

import React, { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global client-side exception caught in root layout:", error);

    // If an error occurred in root layout, purge all service worker caches to prevent stale chunk lockouts
    if (typeof window !== "undefined") {
      try {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          }).catch(() => {});
        }
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          }).catch(() => {});
        }
      } catch {
        // Ignore errors during cache cleanup
      }

      // Auto-reload once on ChunkLoadError
      try {
        const isChunkError =
          error?.message?.includes("Loading chunk") ||
          error?.message?.includes("ChunkLoadError") ||
          error?.message?.includes("Failed to fetch") ||
          error?.name === "ChunkLoadError";

        if (isChunkError) {
          const hasReloaded = sessionStorage.getItem("wcm_global_reload");
          if (!hasReloaded) {
            sessionStorage.setItem("wcm_global_reload", "true");
            window.location.reload();
          }
        }
      } catch {
        // Storage access may be blocked
      }
    }
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("wcm_global_reload");
      } catch {}
      window.location.href = "/login";
    } else {
      reset();
    }
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-[#06061a] text-white font-sans antialiased">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-wider text-white">
              Application Refresh Needed
            </h2>
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              A newer version of WCM Outreach has been published. Click below to reload and sync the latest updates.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleReload}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer min-h-11"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload WCM Outreach</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
