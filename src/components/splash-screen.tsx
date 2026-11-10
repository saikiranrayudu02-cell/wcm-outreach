"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Sparkles, Shield, ChevronRight } from "lucide-react";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Connecting to The War of Carmel Ministries...");
  const [canSkip, setCanSkip] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const skipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDismissedRef = useRef(false);

  const handleDismiss = useCallback(() => {
    if (isDismissedRef.current) return;
    isDismissedRef.current = true;

    // Immediately cancel pending animation frames and timers
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    setFadeOut(true);
    hideTimerRef.current = setTimeout(() => setShow(false), 350);
  }, []);

  useEffect(() => {
    // Global keyboard listener for instant dismiss
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Show skip prompt after 500ms
    skipTimerRef.current = setTimeout(() => {
      if (!isDismissedRef.current) setCanSkip(true);
    }, 500);

    // Smooth cubic eased progress loop over 1800ms
    const startTime = performance.now();
    const duration = 1800;

    const updateProgress = (currentTime: number) => {
      if (isDismissedRef.current) return;

      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Smooth cubic ease-out
      const easeOut = 1 - Math.pow(1 - t, 3.2);
      const currentPct = Math.min(Math.round(easeOut * 100), 100);

      setProgress(currentPct);

      if (currentPct < 26) {
        setStatusText("Connecting to The War of Carmel Ministries...");
      } else if (currentPct < 60) {
        setStatusText("Synchronizing Field Outreach Records...");
      } else if (currentPct < 88) {
        setStatusText("Initializing Verification & Calling Systems...");
      } else {
        setStatusText("Welcome • Entering Ministry Portal...");
      }

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Complete -> trigger smooth cinematic exit
        exitTimerRef.current = setTimeout(() => {
          if (!isDismissedRef.current) {
            handleDismiss();
          }
        }, 220);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [handleDismiss]);

  if (!show) return null;

  return (
    <div
      onClick={handleDismiss}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          handleDismiss();
        }
      }}
      tabIndex={0}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none bg-[#03050c] text-white cursor-pointer outline-none transition-all duration-500 ease-out pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] px-4 sm:px-6 overflow-hidden ${
        fadeOut ? "opacity-0 scale-[1.03] blur-[4px] pointer-events-none" : "opacity-100 scale-100 blur-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="The War of Carmel Ministries Outreach Platform"
      title="Tap or press Esc to continue"
    >
      {/* 1. Celestial Royal Midnight Background & Atmospheric Halo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial blue-indigo atmospheric glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[750px] h-[600px] sm:h-[750px] rounded-full bg-radial from-blue-600/30 via-indigo-500/20 to-transparent blur-3xl animate-splash-halo" />

        {/* Golden ambient ray accent behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] rounded-full bg-radial from-amber-400/25 via-amber-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Dual Gyroscopic Orbit Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full border border-blue-400/20 border-dashed animate-splash-ring-cw pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full border border-amber-300/20 animate-splash-ring-ccw pointer-events-none" />

        {/* Subtle Ambient Twinkling Stars */}
        <div className="absolute top-[18%] left-[15%] w-1.5 h-1.5 rounded-full bg-amber-200 animate-splash-twinkle-1 pointer-events-none" />
        <div className="absolute top-[28%] right-[18%] w-1.5 h-1.5 rounded-full bg-blue-300 animate-splash-twinkle-2 pointer-events-none" />
        <div className="absolute bottom-[24%] left-[22%] w-1 h-1 rounded-full bg-white/70 animate-splash-twinkle-2 pointer-events-none" />
        <div className="absolute bottom-[30%] right-[14%] w-1.5 h-1.5 rounded-full bg-amber-300/80 animate-splash-twinkle-1 pointer-events-none" />
      </div>

      {/* 2. Top Header: Ministry Status Badge */}
      <div className="w-full max-w-md flex items-center justify-between relative z-10 pt-2 sm:pt-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-200 font-mono">
            WCM OFFICIAL PORTAL
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          <span className="tracking-wider">SECURE</span>
        </div>
      </div>

      {/* 3. Center Hero: Emblem Badge, Ministry Name, Platform Title, Progress */}
      <div className="flex flex-col items-center justify-center my-auto relative z-10 text-center max-w-lg w-full px-2">
        {/* Emblem Showcase Card */}
        <div className="relative animate-splash-logo mb-6 sm:mb-8 group">
          {/* Radiant Halo behind Logo Box */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-600/50 via-amber-400/40 to-blue-500/50 blur-2xl opacity-85 group-hover:opacity-100 transition-opacity" />

          {/* Frosted Glass Emblem Frame */}
          <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-white/[0.15] via-[#0e1222]/95 to-[#070a14]/98 border border-amber-300/40 shadow-[0_25px_60px_-10px_rgba(20,30,70,0.95)] backdrop-blur-2xl overflow-hidden">
            {/* Golden Specular Shimmer Streak */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-amber-200/30 to-transparent animate-splash-shimmer-gold pointer-events-none" />

            <img
              src="/wcm-logo.png"
              alt="The War of Carmel Ministries Logo"
              width={240}
              height={160}
              loading="eager"
              decoding="async"
              className="h-28 sm:h-40 md:h-44 w-auto max-w-[190px] sm:max-w-[260px] object-contain drop-shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Fallback to PWA high-res icon
                (e.target as HTMLImageElement).src = "/icons/icon-512x512.png";
              }}
            />
          </div>
        </div>

        {/* Full Ministry Name & Brand Titles */}
        <div className="animate-splash-text space-y-2.5 max-w-sm sm:max-w-md">
          {/* Supreme Ministry Name */}
          <h2
            className="text-xs sm:text-sm font-black tracking-[0.22em] text-amber-300 uppercase leading-snug"
            style={{
              textShadow: "0 0 20px rgba(252, 211, 77, 0.7), 0 1px 3px rgba(0, 0, 0, 0.9)",
            }}
          >
            The War of Carmel Ministries
          </h2>

          {/* Program Platform Heading - High Saturation, Fully Opaque & Crisp White with Radiant Illumination */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.16em] text-white uppercase"
            style={{
              textShadow: "0 0 35px rgba(255, 255, 255, 0.9), 0 0 65px rgba(186, 230, 253, 0.5), 0 3px 6px rgba(0, 0, 0, 0.95)",
            }}
          >
            WCM OUTREACH
          </h1>

          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10px] sm:text-[11px] font-black tracking-widest uppercase shadow-xs">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Field Operations & Reporting
          </div>
        </div>

        {/* Dynamic Progress Monitor */}
        <div className="mt-8 sm:mt-10 w-full max-w-[290px] sm:max-w-[320px] space-y-2.5">
          {/* Progress Track with Glowing Head */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.12] p-[1px] overflow-hidden relative shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-sky-400 transition-all duration-100 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/90 blur-[2px] rounded-full" />
            </div>
          </div>

          {/* Micro Status & Real-time Percentage */}
          <div className="flex items-center justify-between text-[11px] font-mono px-0.5">
            <span className="text-slate-200 font-medium truncate max-w-[210px] sm:max-w-[240px] text-left animate-pulse">
              {statusText}
            </span>
            <span className="font-bold text-amber-300 tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer: Skip Prompt & Copyright */}
      <div className="w-full max-w-md flex flex-col items-center justify-center gap-2 relative z-10 pb-2 sm:pb-4 text-center">
        {/* Skip Prompt (fades in smoothly) */}
        <div
          className={`transition-all duration-300 flex items-center gap-1 text-[11px] font-bold tracking-wider text-slate-300 hover:text-amber-200 uppercase ${
            canSkip ? "opacity-90 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <span>Tap anywhere or press</span>
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/15 rounded-md border border-white/25 text-slate-100">
            Esc
          </kbd>
          <span>to enter</span>
          <ChevronRight className="h-3 w-3 text-amber-300" />
        </div>

        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
          The War of Carmel Ministries • All Rights Reserved
        </p>
      </div>
    </div>
  );
}