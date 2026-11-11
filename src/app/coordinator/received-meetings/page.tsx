"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Inbox, Calendar, MapPin, User, Shield, 
  FileCheck, History, Loader2, AlertCircle, Play, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { formatRoleBadge } from "@/lib/translations";
import { MeetingAssignmentHistoryModal } from "@/components/meeting-assignment-history-modal";

export default function CoordinatorReceivedMeetingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <CoordinatorReceivedMeetingsContent />
    </Suspense>
  );
}

function CoordinatorReceivedMeetingsContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingMeetingId, setStartingMeetingId] = useState<string | null>(null);

  // History modal state
  const [selectedMeetingForHistory, setSelectedMeetingForHistory] = useState<any | null>(null);

  useEffect(() => {
    fetchReceivedMeetings();
  }, []);

  const fetchReceivedMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings?tab=received");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      } else {
        toast.error("Failed to load received meetings");
      }
    } catch {
      toast.error("Network error fetching received meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrOpenMeeting = async (meeting: any) => {
    // If meeting report already exists, open it directly
    if (meeting.meetingReportId) {
      router.push(`/coordinator/report/${meeting.meetingReportId}`);
      return;
    }

    setStartingMeetingId(meeting.id);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/start-workflow`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.meetingReportId) {
        toast.success("Verification Form initialized with meeting details!");
        router.push(`/coordinator/report/${data.meetingReportId}`);
      } else {
        toast.error(data.error || "Failed to initialize verification workflow");
      }
    } catch {
      toast.error("Network error starting meeting");
    } finally {
      setStartingMeetingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FORWARDED_TO_COORDINATOR":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "RECEIVED_BY_COORDINATOR":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
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
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Inbox className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Received Meetings
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Meetings forwarded to you by regional leaders. Open the assigned meeting to begin local coordination and submit the Verification Sheet.
            </p>
          </div>

          <button
            onClick={fetchReceivedMeetings}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Refresh
          </button>
        </div>

        {/* Workflow reminder alert */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>Standard Approval Process:</strong> Receiving an assigned meeting allows you to prepare and submit the <strong>Verification Form</strong>. In accordance with ministry protocol, Verification must be sequentially reviewed by your <strong>Zonal Leader &rarr; State Leader &rarr; Central Admin</strong> before Attendance and After-Meeting Evaluation forms unlock.
          </p>
        </div>

        {/* Meetings List Table */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
              <span className="text-xs text-slate-400">Loading your received meetings...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-2">
              <Inbox className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                No Received Meetings
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No meetings have been forwarded to you currently. Any outreach meetings delegated by your regional leaders will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="md:hidden space-y-3.5 p-3">
                {meetings.map((m) => {
                  const latestForward = m.assignmentHistory?.find(
                    (h: any) => h.assignmentAction === "FORWARDED_TO_COORDINATOR"
                  );
                  const forwarder = latestForward?.assignedBy || m.originalLeader;
                  const isStarting = startingMeetingId === m.id;

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
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Forwarded By</span>
                          <span className="font-semibold truncate block">{forwarder?.name || "Regional Leader"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleStartOrOpenMeeting(m)}
                          disabled={isStarting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer min-h-11 disabled:opacity-50"
                        >
                          {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                          <span>{m.meetingReportId ? "Open Verification" : "Start Meeting"}</span>
                        </button>
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
                      <th className="px-6 py-4">Territory</th>
                      <th className="px-6 py-4">Forwarded By</th>
                      <th className="px-6 py-4">Received Date</th>
                      <th className="px-6 py-4">Current Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {meetings.map((m) => {
                      const latestForward = m.assignmentHistory?.find(
                        (h: any) => h.assignmentAction === "FORWARDED_TO_COORDINATOR"
                      );
                      const forwarder = latestForward?.assignedBy || m.originalLeader;
                      const isStarting = startingMeetingId === m.id;

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
                            <span className="font-bold text-slate-800 dark:text-white block">
                              {forwarder?.name || "Regional Leader"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                              {formatRoleBadge(forwarder?.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                            {new Date(latestForward?.createdAt || m.updatedAt).toLocaleDateString([], {
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
                              <button
                                onClick={() => handleStartOrOpenMeeting(m)}
                                disabled={isStarting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer min-h-9"
                              >
                                {isStarting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <FileCheck className="h-3.5 w-3.5" />
                                )}
                                {m.meetingReportId ? "Open Verification" : "Start Meeting"}
                              </button>

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
