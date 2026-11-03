"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isIosDevice: boolean;
  isAndroidDevice: boolean;
  installApp: () => Promise<void>;
  showInstallBanner: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isStandalone: false,
  isIosDevice: false,
  isAndroidDevice: false,
  installApp: async () => {},
  showInstallBanner: () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Detect if already running in standalone mode (installed app)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const alreadyInstalled = checkStandalone();

    // 2. Clear obsolete caches and register Service Worker safely
    if (typeof window !== "undefined") {
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key !== "wcm-outreach-pwa-v2") {
              caches.delete(key);
            }
          });
        }).catch(() => {});
      }

      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              reg.update().catch(() => {});
              console.log("WCM ServiceWorker registered with scope:", reg.scope);
            })
            .catch((err) => {
              console.warn("WCM ServiceWorker registration failed:", err);
            });
        });
      }
    }

    if (alreadyInstalled) {
      return;
    }

    // 3. Clear any legacy 5-day lockout from previous versions so mobile users see the prompt
    try {
      localStorage.removeItem("wcm_pwa_dismissed_until");
    } catch {
      // Ignore localStorage errors
    }

    // 4. Detect device platform safely
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent.toLowerCase() : "";
    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (typeof navigator !== "undefined" && (navigator as any).platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(userAgent);
    setIsIosDevice(isIos);
    setIsAndroidDevice(isAndroid);

    // 5. Check if user dismissed the prompt in this active browser session
    const isSessionDismissed = sessionStorage.getItem("wcm_pwa_session_dismissed") === "true";

    // 6. Show the install prompt banner after a brief gentle delay (1.5 seconds)
    // Ensures mobile and desktop users see the download prompt box immediately
    let initialTimer: NodeJS.Timeout | undefined;
    if (!isSessionDismissed) {
      initialTimer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
    }

    // 7. Capture native beforeinstallprompt (Android Chrome / Edge / Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isSessionDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 8. Handle app installed event
    const handleAppInstalled = () => {
      console.log("WCM Outreach PWA successfully installed");
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowIosGuide(false);
      setShowAndroidGuide(false);
      setIsStandalone(true);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. If native install prompt is available (Android Chrome / Desktop Chrome)
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
        return;
      } catch (err) {
        console.error("Error triggering install prompt:", err);
      }
    }

    // 2. If on iOS (iPhone / iPad), show step-by-step iOS instructions
    if (isIosDevice) {
      setShowIosGuide(true);
      return;
    }

    // 3. If on Android without native prompt or any other mobile browser
    if (isAndroidDevice) {
      setShowAndroidGuide(true);
      return;
    }

    // 4. Default: Show Android / Browser guide
    setShowAndroidGuide(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      sessionStorage.setItem("wcm_pwa_session_dismissed", "true");
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const contextValue: PwaContextType = {
    isInstallable: !isStandalone,
    isStandalone,
    isIosDevice,
    isAndroidDevice,
    installApp: handleInstallClick,
    showInstallBanner: () => {
      if (deferredPrompt) {
        handleInstallClick();
      } else if (isIosDevice) {
        setShowIosGuide(true);
      } else {
        setShowAndroidGuide(true);
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

      {/* Floating App Download / Install Prompt Box (Mobile & Desktop) */}
      {!isStandalone && showBanner && (
        <div className="fixed bottom-4 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white dark:bg-slate-900 border border-slate-200/95 dark:border-slate-800 rounded-2xl p-4 shadow-[0_16px_50px_rgba(0,0,0,0.28)] animate-sheetSlideUp backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/icons/icon-192x192.png"
                alt="WCM Outreach App"
                className="h-12 w-12 rounded-2xl object-contain shadow-md border border-slate-100 dark:border-slate-800 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    Download WCM App
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                    Mobile App
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Install on your phone for fullscreen access, faster loading, and offline support.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss install banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-11"
            >
              <Download className="h-4 w-4" />
              Download App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer min-h-11"
            >
              Later
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
                  <p className="text-[11px] text-slate-400">Follow these 3 quick steps</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    Tap the Share Button
                    <Share className="h-3.5 w-3.5 text-blue-500 inline" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Located at the bottom of Safari on iPhone, or top bar on iPad.
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
                    Scroll down the options list and tap Add to Home Screen.
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
                    Confirm and the WCM Outreach app icon will appear directly on your home screen!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-11"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Android / Mobile Browser Add to Home Screen Instructions Modal */}
      {showAndroidGuide && (
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
                    Install on Your Phone
                  </h3>
                  <p className="text-[11px] text-slate-400">Follow these 3 quick steps</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    Tap the Browser Menu
                    <MoreVertical className="h-3.5 w-3.5 text-blue-500 inline" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Tap the 3 dots (⋮) in the top-right or bottom-right corner of Chrome / your browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    Tap "Install app" or "Add to Home screen"
                    <Download className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 inline" />
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Look for "Install app" or "Add to Home screen" in the browser menu options.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-white">Tap "Install" to Confirm</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    WCM Outreach will be installed right on your phone alongside your other apps!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAndroidGuide(false);
                handleDismiss();
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-11"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
