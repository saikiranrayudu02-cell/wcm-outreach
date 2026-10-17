"use client";

import React, { useEffect, useState } from "react";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out at 3.4s, fully unmount at 4.0s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3400);

    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #06061a 0%, #0f0a2e 25%, #1e1b4b 50%, #312e81 75%, #4338ca 100%)",
      }}
    >
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          className="absolute w-150 h-150 rounded-full border border-indigo-500/10 splash-ring"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute w-112.5 h-112.5 rounded-full border border-indigo-400/8 splash-ring"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute w-75 h-75 rounded-full border border-indigo-300/6 splash-ring"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Logo */}
      <div className="splash-logo relative">
        <div className="relative">
          <div 
            className="absolute -inset-4 rounded-3xl opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <img
            src="/icons/icon-512x512.png"
            alt="WCM Logo"
            className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-contain shadow-2xl"
            style={{
              boxShadow: "0 0 60px rgba(99,102,241,0.3), 0 20px 60px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div className="splash-text mt-8 text-center">
        <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white uppercase">
          WCM Outreach
        </h1>
        <p className="mt-2 text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-indigo-300/70 uppercase">
          Ministry Reporting System
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-10 w-48 sm:w-56 overflow-hidden">
        <div className="h-0.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div 
            className="h-full rounded-full splash-progress"
            style={{
              width: "0%",
              background: "linear-gradient(90deg, rgba(129,140,248,0.3) 0%, rgba(167,139,250,0.8) 50%, rgba(129,140,248,0.3) 100%)",
            }}
          />
        </div>
      </div>

      {/* Footer text */}
      <div className="absolute bottom-8 sm:bottom-10 text-center">
        <p className="text-[9px] sm:text-[10px] text-indigo-400/40 font-semibold tracking-[0.15em] uppercase">
          World Christian Ministry
        </p>
      </div>
    </div>
  );
}
