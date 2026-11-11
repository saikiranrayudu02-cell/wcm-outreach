"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Search, Filter, Eye, Pencil, Trash2, 
  CheckCircle2, Clock, Lock, AlertCircle, ArrowUpRight, ShieldCheck, MapPin
} from "lucide-react";
import { FormStatusBadge } from "@/components/form-status-badge";
import { FormTrackingModal } from "@/components/form-tracking-modal";

export interface FormTrackingTableProps {
  reports: any[];
  loading: boolean;
  currentRole: "COORDINATOR" | "ZONE_LEADER" | "STATE_LEADER" | "ADMIN" | "LEADER";
  currentUsername?: string;
  onRefresh?: () => void;
  onDeleteReport?: (id: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function FormTrackingTable({
  reports,
  loading,
  currentRole,
  currentUsername,
  onRefresh,
  onDeleteReport,
  title = "Meeting Reports & Form Tracking",
  subtitle = "Track lifecycle forms through Coordinator → Zonal Leader → State Leader → Admin workflow stages.",
  className = "",
}: FormTrackingTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Filter reports locally by search query and overall/form status
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !search.trim() ||
      r.reportId?.toLowerCase().includes(search.toLowerCase()) ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.coordinatorName?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase()) ||
      r.state?.toLowerCase().includes(search.toLowerCase()) ||
      r.district?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") {
      return (
        r.verificationStatus === "PENDING" ||
        r.attendanceStatus === "PENDING" ||
        r.evaluationStatus === "PENDING"
      );
    }
    if (statusFilter === "SUBMITTED") {
      return (
        r.verificationStatus === "SUBMITTED" ||
        r.attendanceStatus === "SUBMITTED" ||
        r.evaluationStatus === "SUBMITTED"
      );
    }
    if (statusFilter === "FORWARDED_TO_STATE") {
      return (
        r.verificationStatus === "FORWARDED_TO_STATE" ||
        r.attendanceStatus === "FORWARDED_TO_STATE" ||
        r.evaluationStatus === "FORWARDED_TO_STATE"
      );
    }
    if (statusFilter === "FORWARDED_TO_ADMIN") {
      return (
        r.verificationStatus === "FORWARDED_TO_ADMIN" ||
        r.attendanceStatus === "FORWARDED_TO_ADMIN" ||
        r.evaluationStatus === "FORWARDED_TO_ADMIN"
      );
    }
    if (statusFilter === "COMPLETED") {
      return (
        r.verificationStatus === "COMPLETED" &&
        r.attendanceStatus === "COMPLETED" &&
        r.evaluationStatus === "COMPLETED"
      );
    }
    if (statusFilter === "REJECTED") {
      return (
        r.verificationStatus === "REJECTED" ||
        r.attendanceStatus === "REJECTED" ||
        r.evaluationStatus === "REJECTED"
      );
    }

    return true;
  });

  return (
    <div className={`space-y-4 text-left ${className}`}>
      {/* Table Header & Search/Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-foreground/50 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports, convener, location..."
              className="h-8 pl-8 pr-3 rounded-xl border border-border/60 bg-accent/30 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-border/60 bg-accent/30 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="SUBMITTED">Under Zone Review</option>
              <option value="FORWARDED_TO_STATE">Under State Review</option>
              <option value="FORWARDED_TO_ADMIN">Under Admin Review</option>
              <option value="COMPLETED">Completed / Approved</option>
              <option value="REJECTED">Returned for Corrections</option>
              <option value="PENDING">Pending Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Card Content */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-foreground/40">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-xs font-bold uppercase tracking-wider">Loading reports...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-12 text-center text-xs text-foreground/40 font-bold uppercase tracking-wider italic">
          {reports.length === 0 ? "No reports found for this role." : "No reports matching the active filter."}
        </div>
      ) : (
        <>
          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredReports.map((r: any) => (
              <div
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className="p-4 rounded-2xl bg-accent/25 border border-border/60 space-y-3 shadow-xs cursor-pointer hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-primary">
                      {r.reportId}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">
                      {r.title || `Outreach Meeting ${r.reportId}`}
                    </h4>
                    <span className="text-[10px] text-foreground/50 font-semibold block">
                      Coordinator: {r.coordinatorName || r.leader?.username || "Leader"}
                      {r.zone && ` • ${r.zone}`}
                      {r.state && ` • ${r.state}`}
                    </span>
                  </div>
                </div>

                {/* 3 Form Status Badges */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">1. Verification</span>
                    <FormStatusBadge status={r.verificationStatus} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">2. Attendance</span>
                    <FormStatusBadge status={r.attendanceStatus} isLocked={r.isAttendanceLocked} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50">3. Evaluation</span>
                    <FormStatusBadge status={r.evaluationStatus} isLocked={r.isEvaluationLocked} size="sm" />
                  </div>
                </div>

                <div className="text-xs space-y-1 text-foreground/70">
                  <div className="flex justify-between">
                    <span className="text-foreground/40 font-semibold">Dates:</span>
                    <span className="font-bold">{r.meetingDates || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/40 font-semibold">Location:</span>
                    <span className="font-bold truncate max-w-50 text-right">{r.location || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {(currentRole === "COORDINATOR" || currentRole === "LEADER") && r.rawStatus === "DRAFT" && onDeleteReport && (
                    <button
                      onClick={() => onDeleteReport(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReportId(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-colors shadow-xs cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Track Form & Timeline
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-slate-100 dark:bg-[#202024] text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider text-left">
                  <th className="px-5 py-3.5">Meeting Details</th>
                  <th className="px-5 py-3.5">Dates & Venue</th>
                  <th className="px-5 py-3.5">Coordinator / Area</th>
                  <th className="px-4 py-3.5 text-center">1. Verification</th>
                  <th className="px-4 py-3.5 text-center">2. Attendance</th>
                  <th className="px-4 py-3.5 text-center">3. Evaluation</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredReports.map((r: any) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedReportId(r.id)}
                    className="hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-black text-primary">{r.reportId}</div>
                      <div className="text-xs font-bold text-foreground mt-0.5">{r.title || `Outreach Meeting ${r.reportId}`}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-foreground">{r.meetingDates || "N/A"}</div>
                      <div className="text-[11px] text-foreground/50 mt-0.5 truncate max-w-48 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {r.location || "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold block text-xs text-foreground">{r.coordinatorName || r.leader?.username}</span>
                      <span className="text-[10px] text-foreground/50 block font-medium">
                        {r.zone || r.leader?.zone || "Zone"} • {r.state || r.leader?.state || "State"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <FormStatusBadge status={r.verificationStatus} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <FormStatusBadge status={r.attendanceStatus} isLocked={r.isAttendanceLocked} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <FormStatusBadge status={r.evaluationStatus} isLocked={r.isEvaluationLocked} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {(currentRole === "COORDINATOR" || currentRole === "LEADER") && r.rawStatus === "DRAFT" && onDeleteReport && (
                          <button
                            onClick={() => onDeleteReport(r.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20 cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {(currentRole === "COORDINATOR" || currentRole === "LEADER") && (
                          <button
                            onClick={() => router.push(`/coordinator/report/${r.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background hover:bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground/80 transition-colors cursor-pointer"
                            title="Manage / Edit Form Data"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedReportId(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white hover:opacity-90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Track Form
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Shared Unified Form Tracking Modal with Workflow Timeline */}
      <FormTrackingModal
        isOpen={Boolean(selectedReportId)}
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        currentRole={currentRole}
        currentUsername={currentUsername}
        onUpdated={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
