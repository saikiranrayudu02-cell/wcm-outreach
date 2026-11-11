import React from "react";

export interface RoleBadgeProps {
  role?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function RoleBadge({ role, className = "", size = "sm" }: RoleBadgeProps) {
  const sizeClasses =
    size === "xs"
      ? "px-2 py-0.5 text-[8.5px]"
      : size === "md"
      ? "px-3 py-1 text-xs"
      : "px-2.5 py-0.5 text-[10px]";

  if (!role) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-slate-500/15 dark:bg-slate-500/25 text-slate-700 dark:text-slate-200 border border-slate-500/30 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
        Unassigned
      </span>
    );
  }

  const raw = String(role).trim();
  const clean = raw.toUpperCase().replace(/[\s_-]+/g, "");

  if (clean === "ADMIN") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-200 border border-purple-500/30 dark:border-purple-400/40 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shrink-0 shadow-xs" />
        Admin
      </span>
    );
  }

  if (clean === "STATELEADER") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-200 border border-blue-500/30 dark:border-blue-400/40 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0 shadow-xs" />
        State Leader
      </span>
    );
  }

  if (clean === "ZONELEADER" || clean === "ZONALLEADER") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30 dark:border-emerald-400/40 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0 shadow-xs" />
        Zonal Leader
      </span>
    );
  }

  // COORDINATOR or other roles
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 dark:border-amber-400/40 ${sizeClasses} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0 shadow-xs" />
      {clean === "COORDINATOR" ? "Coordinator" : raw.toUpperCase().replace(/_/g, " ")}
    </span>
  );
}
