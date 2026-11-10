"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

export function CapacitorSystemBarsSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform()) return;

    try {
      const isDark = resolvedTheme === "dark";
      SystemBars.setStyle({
        style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch((err) => {
        console.warn("[SystemBars] Failed to sync style:", err);
      });
    } catch {
      // Ignore in non-native environments
    }
  }, [resolvedTheme]);

  return null;
}

