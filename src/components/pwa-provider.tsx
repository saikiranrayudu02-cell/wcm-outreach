"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isIosDevice: boolean;
  installApp: () => Promise<void>;
  showInstallBanner: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isStandalone: false,
  isIosDevice: false,
  installApp: async () => {},
  showInstallBanner: () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Detect if already running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const alreadyInstalled = checkStandalone();

    // 2. Register Service Worker safely
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("WCM ServiceWorker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("WCM ServiceWorker registration failed:", err);
          });
      });
    }

    if (alreadyInstalled) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) &&
      !/chrome|crios|crmo|firefox|fxios|edg|edge|opr|opera/.test(userAgent);
    setIsIosDevice(isIos);

    // 4. Check if user recently dismissed install prompt (cooling period 5 days)
    const dismissedUntil = localStorage.getItem("wcm_pwa_dismissed_until");
    const isCoolingDown = dismissedUntil && Number(dismissedUntil) > Date.now();

    // 5. Capture native beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isCoolingDown) {
        // Show install prompt banner after a brief gentle delay (2 seconds)
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. Handle app installed event
    const handleAppInstalled = () => {
      console.log("WCM Outreach PWA successfully installed");
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowIosGuide(false);
      setIsStandalone(true);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 7. For iOS Safari users without native prompt, show prompt if not cooling down
    if (isIos && isSafari && !isCoolingDown) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          console.log("User accepted PWA installation");
          setShowBanner(false);
          setDeferredPrompt(null);
        } else {
          console.log("User dismissed PWA installation");
          handleDismiss();
        }
      } catch (err) {
        console.error("Error triggering install prompt:", err);
      }
    } else if (isIosDevice) {
      // Show iOS step-by-step modal guide
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 5 days
    const fiveDaysMs = Date.now() + 5 * 24 * 60 * 60 * 1000;
    localStorage.setItem("wcm_pwa_dismissed_until", fiveDaysMs.toString());
  };

  const contextValue: PwaContextType = {
    isInstallable: (!isStandalone && (Boolean(deferredPrompt) || isIosDevice)),
    isStandalone,
    isIosDevice,
    installApp: handleInstallClick,
    showInstallBanner: () => {
      if (isIosDevice) {
        setShowIosGuide(true);
      } else if (deferredPrompt) {
        setShowBanner(true);
      } else {
        handleInstallClick();
      }
    },
  };

  return (
    <PwaContext.Provider value={contextValue}>
      {children}

      {/* Installation Success Notification Toast */}
      {installedSuccess && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>WCM Outreach installed successfully to your home screen!</span>
        </div>
      )}

      {/* Floating App Install Banner (Mobile & Desktop) */}
      {!isStandalone && showBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] animate-sheetSlideUp backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src="/icons/icon-192x192.png"
                alt="WCM Outreach App"
                className="h-12 w-12 rounded-2xl object-contain shadow-md border border-slate-100 dark:border-slate-800 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  Install WCM Outreach
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Add to home screen for full-screen access, fast loading, and native app feel.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss install banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer min-h-10"
            >
              <Download className="h-4 w-4" />
              {isIosDevice ? "How to Install" : "Install App"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer min-h-10"
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* iOS / iPadOS Add to Home Screen Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-sheetSlideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192x192.png"
                  alt="WCM Logo"
                  className="h-10 w-10 rounded-xl object-contain shadow-xs border border-slate-100 dark:border-slate-800"
                />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-slate-400">Follow these 3 simple steps</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    Tap the Safari Share Button
                    <Share className="h-3.5 w-3.5 text-blue-500 inline" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Located at the bottom of your screen on iPhone, or top bar on iPad.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    Select "Add to Home Screen"
                    <PlusSquare className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 inline" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Scroll down in the share sheet and tap the Add to Home Screen option.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white">Tap "Add" in Top-Right</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Confirm the name and WCM icon will appear right on your phone home screen!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-10"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
