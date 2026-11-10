"use client";

import React from "react";
import { 
  X, Calendar, Clock, MapPin, User, Shield, 
  ArrowRight, FileCheck, CheckCircle2, History 
} from "lucide-react";
import { formatRoleBadge, formatRoleName } from "@/lib/translations";

interface HistoryModalProps {
  meeting: any | null;
  onClose: () => void;
}

export function MeetingAssignmentHistoryModal({ meeting, onClose }: HistoryModalProps) {
  if (!meeting) return null;

  const history = meeting.assignmentHistory || [];

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
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white animate-modal flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-7 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {meeting.referenceId}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(meeting.status)}`}>
                {meeting.status?.replace(/_/g, " ")}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Assignment & Audit History
            </h3>
            <p className="text-xs text-slate-400">
              Organizer: <strong className="text-white">{meeting.organizerName}</strong> &bull; {meeting.district}, {meeting.state}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Timeline */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Meeting Date</span>
              <span className="font-bold text-white mt-0.5 block">
                {new Date(meeting.meetingDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Assignee</span>
              <span className="font-bold text-indigo-300 mt-0.5 block truncate">
                {meeting.currentAssignee?.name || "Unassigned"}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                {formatRoleBadge(meeting.currentAssigneeRole || meeting.currentAssignee?.role)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Original Leader</span>
              <span className="font-bold text-slate-200 mt-0.5 block truncate">
                {meeting.originalLeader?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Created By</span>
              <span className="font-bold text-slate-200 mt-0.5 block truncate">
                {meeting.createdBy?.name || "Admin"}
              </span>
            </div>
          </div>

          {/* Timeline Events */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-indigo-400" />
              Event Timeline ({history.length} Transition{history.length !== 1 ? "s" : ""})
            </h4>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                No assignment history records found.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {history.map((event: any, index: number) => (
                  <div key={event.id || index} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-900 ring-2 ring-indigo-500/20 group-hover:scale-125 transition-transform" />

                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs space-y-2 hover:border-slate-600 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-white text-[11px] uppercase tracking-wider bg-slate-700/60 px-2 py-0.5 rounded-md">
                          {event.assignmentAction?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(event.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Transition description */}
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        {event.previousAssignee ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-400">{event.previousAssignee.name}</span>
                            <span className="text-[9px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded font-bold uppercase">
                              {formatRoleBadge(event.previousRole || event.previousAssignee.role)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-500" />
                          </div>
                        ) : null}

                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-300">{event.newAssignee?.name}</span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold uppercase">
                            {formatRoleBadge(event.newRole || event.newAssignee?.role)}
                          </span>
                        </div>
                      </div>

                      {/* Remarks */}
                      {event.remarks && (
                        <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 italic">
                          &ldquo;{event.remarks}&rdquo;
                        </p>
                      )}

                      <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-500" />
                        <span>Action performed by: </span>
                        <strong className="text-white">{event.assignedBy?.name || "System"}</strong>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase">
                          ({formatRoleBadge(event.assignedBy?.role)})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-7 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
