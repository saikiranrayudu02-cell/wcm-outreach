"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  CalendarCheck, Clock, MapPin, User, Shield, 
  Send, UserCheck, History, FileCheck, Loader2, AlertCircle, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { formatRoleBadge } from "@/lib/translations";
import { LeaderMeetingActionModal } from "@/components/leader-meeting-action-modal";
import { MeetingAssignmentHistoryModal } from "@/components/meeting-assignment-history-modal";

export default function StateLeaderAssignedMeetingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <StateLeaderAssignedMeetingsContent />
    </Suspense>
  );
}

function StateLeaderAssignedMeetingsContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedMeetingForAction, setSelectedMeetingForAction] = useState<any | null>(null);
  const [selectedMeetingForHistory, setSelectedMeetingForHistory] = useState<any | null>(null);

  useEffect(() => {
    fetchAssignedMeetings();
  }, []);

  const fetchAssignedMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings?tab=assigned");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      } else {
        toast.error("Failed to load assigned meetings");
      }
    } catch {
      toast.error("Network error fetching meetings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED_TO_LEADER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "SELF_HANDLED_BY_LEADER":
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
      case "FORWARDED_TO_COORDINATOR":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "IN_PROGRESS":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn text-left pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Assigned Meetings
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Meetings assigned to you by Administration. Decide whether to handle personally or delegate to a local coordinator.
            </p>
          </div>

          <button
            onClick={fetchAssignedMeetings}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Refresh
          </button>
        </div>

        {/* Meeting Cards / Table */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400">Loading your assigned meetings...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                No Assigned Meetings Found
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You currently have no new meetings assigned by Administration. Check back later or review your state reports.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="md:hidden space-y-3.5 p-3">
                {meetings.map((m) => {
                  const isPendingDecision = m.status === "ASSIGNED_TO_LEADER" || m.status === "ACCEPTED_BY_LEADER";
                  const isSelfHandled = m.status === "SELF_HANDLED_BY_LEADER";
                  const isForwarded = m.status === "FORWARDED_TO_COORDINATOR";

                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {m.referenceId}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadge(m.status)}`}>
                          {m.status?.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {m.organizerName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {m.district}, {m.state}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Meeting Date</span>
                          <span className="font-semibold">
                            {new Date(m.meetingDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assigned By</span>
                          <span className="font-semibold">{m.createdBy?.name || "Admin"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {isPendingDecision && (
                          <button
                            onClick={() => setSelectedMeetingForAction(m)}
                            className="flex-1 inline-flex items-center justify-center py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer min-h-11"
                          >
                            Take Action
                          </button>
                        )}

                        {isSelfHandled && (
                          <button
                            onClick={async () => {
                              if (m.meetingReportId) {
                                router.push(`/coordinator/report/${m.meetingReportId}`);
                              } else {
                                const res = await fetch(`/api/meetings/${m.id}/start-workflow`, { method: "POST" });
                                const data = await res.json();
                                if (res.ok && data.meetingReportId) {
                                  router.push(`/coordinator/report/${data.meetingReportId}`);
                                } else {
                                  toast.error("Failed to open report");
                                }
                              }
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer min-h-11"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            Open Form
                          </button>
                        )}

                        {isForwarded && (
                          <span className="flex-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-2 rounded-xl border border-amber-500/20 text-center">
                            Assigned to {m.currentAssignee?.name}
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedMeetingForHistory(m)}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center shrink-0"
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#38383e] bg-slate-100 dark:bg-[#202024] text-slate-900 dark:text-white uppercase tracking-wider text-[10px] font-black">
                      <th className="px-6 py-4">Reference ID</th>
                      <th className="px-6 py-4">Person Arranging (Name)</th>
                      <th className="px-6 py-4">Meeting Date</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Assigned By</th>
                      <th className="px-6 py-4">Assignment Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {meetings.map((m) => {
                      const isPendingDecision = m.status === "ASSIGNED_TO_LEADER" || m.status === "ACCEPTED_BY_LEADER";
                      const isSelfHandled = m.status === "SELF_HANDLED_BY_LEADER";
                      const isForwarded = m.status === "FORWARDED_TO_COORDINATOR";

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {m.referenceId}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                            {m.organizerName}
                          </td>
                          <td className="px-6 py-4">
                            {new Date(m.meetingDate).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {m.district}, {m.state}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800 dark:text-white block">
                              {m.createdBy?.name || "Admin"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Administrator</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                            {new Date(m.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(m.status)}`}>
                              {m.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPendingDecision && (
                                <button
                                  onClick={() => setSelectedMeetingForAction(m)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer min-h-9"
                                >
                                  Take Action
                                </button>
                              )}

                              {isSelfHandled && (
                                <button
                                  onClick={async () => {
                                    if (m.meetingReportId) {
                                      router.push(`/coordinator/report/${m.meetingReportId}`);
                                    } else {
                                      const res = await fetch(`/api/meetings/${m.id}/start-workflow`, { method: "POST" });
                                      const data = await res.json();
                                      if (res.ok && data.meetingReportId) {
                                        router.push(`/coordinator/report/${data.meetingReportId}`);
                                      } else {
                                        toast.error("Failed to open report");
                                      }
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer min-h-9"
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  Open Form
                                </button>
                              )}

                              {isForwarded && (
                                <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                  Assigned to {m.currentAssignee?.name}
                                </span>
                              )}

                              <button
                                onClick={() => setSelectedMeetingForHistory(m)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-9"
                                title="View History"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Action Modal */}
        {selectedMeetingForAction && (
          <LeaderMeetingActionModal
            meeting={selectedMeetingForAction}
            onClose={() => setSelectedMeetingForAction(null)}
            onSuccess={fetchAssignedMeetings}
          />
        )}

        {/* History Modal */}
        {selectedMeetingForHistory && (
          <MeetingAssignmentHistoryModal
            meeting={selectedMeetingForHistory}
            onClose={() => setSelectedMeetingForHistory(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
