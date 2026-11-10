import React from "react";

export interface RoleBadgeProps {
  role?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function RoleBadge({ role, className = "", size = "sm" }: RoleBadgeProps) {
  if (!role) return null;

  const norm = role.toUpperCase();
  const sizeClasses =
    size === "xs"
      ? "px-2 py-0.5 text-[8.5px]"
      : size === "md"
      ? "px-3 py-1 text-xs"
      : "px-2.5 py-0.5 text-[10px]";

  if (norm === "ADMIN") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
        Admin
      </span>
    );
  }

  if (norm === "STATE_LEADER") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
        State Leader
      </span>
    );
  }

  if (norm === "ZONE_LEADER") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 ${sizeClasses} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        Zonal Leader
      </span>
    );
  }

  // COORDINATOR or other roles
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 ${sizeClasses} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
      {norm === "COORDINATOR" ? "Coordinator" : norm.replace(/_/g, " ")}
    </span>
  );
}

