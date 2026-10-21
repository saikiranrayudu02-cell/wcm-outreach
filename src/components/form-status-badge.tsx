import React from "react";
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Lock } from "lucide-react";

export type FormStatusType =
  | "PENDING"
  | "SUBMITTED"
  | "FORWARDED_TO_STATE"
  | "FORWARDED_TO_ADMIN"
  | "REJECTED"
  | "COMPLETED"
  | string;

interface FormStatusBadgeProps {
  status: FormStatusType;
  isLocked?: boolean;
  size?: "sm" | "md";
}

export function FormStatusBadge({ status, isLocked = false, size = "md" }: FormStatusBadgeProps) {
  const normStatus = (status || "PENDING").toUpperCase();

  if (isLocked) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 ${
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
      }`}>
        <Lock className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        <span>Locked</span>
      </span>
    );
  }

  switch (normStatus) {
    case "COMPLETED":
    case "APPROVED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/60 shadow-xs ${
          size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}>
          <CheckCircle2 className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Completed</span>
        </span>
      );

    case "FORWARDED_TO_ADMIN":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-600/60 ${
          size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}>
          <ArrowUpRight className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Forwarded to Admin</span>
        </span>
      );

    case "FORWARDED_TO_STATE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/60 ${
          size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}>
          <ArrowUpRight className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Forwarded to State</span>
        </span>
      );

    case "SUBMITTED":
    case "ZONE_LEADER_REVIEW":
    case "UNDER_REVIEW":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-600/60 ${
          size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}>
          <Clock className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Under Review</span>
        </span>
      );

    case "REJECTED":
    case "REQUEST_CHANGES":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-600/60 ${
          size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}>
          <AlertCircle className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Rejected</span>
        </span>
      );

    case "PENDING":
    case "DRAFT":
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 ${
          size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}>
          <Clock className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Pending</span>
        </span>
      );
  }
}
