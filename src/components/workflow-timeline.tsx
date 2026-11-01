"use client";

import React from "react";
import { CheckCircle2, Clock, AlertCircle, ArrowRight, ShieldCheck, UserCheck, Send, Check } from "lucide-react";

export type StageState = "completed" | "current" | "waiting" | "rejected";

export interface WorkflowStageInfo {
  number: number;
  roleTitle: string;
  stageName: string;
  state: StageState;
  actorName?: string | null;
  actorRole?: string | null;
  timestamp?: string | Date | null;
  details?: string | null;
  comment?: string | null;
}

interface WorkflowTimelineProps {
  formType: "VERIFICATION" | "ATTENDANCE" | "EVALUATION";
  status: string;
  isLocked?: boolean;
  auditLogs?: any[];
  submittedAt?: string | Date | null;
  approvedAt?: string | Date | null;
  rejectedAt?: string | Date | null;
  coordinatorName?: string;
  reviewerComments?: any[];
  className?: string;
}

export function WorkflowTimeline({
  formType,
  status,
  isLocked = false,
  auditLogs = [],
  submittedAt,
  approvedAt,
  rejectedAt,
  coordinatorName,
  reviewerComments = [],
  className = "",
}: WorkflowTimelineProps) {
  const normStatus = (status || "PENDING").toUpperCase();
  const formKey = formType.toUpperCase();

  // Strict: Filter audit logs ONLY for this specific form type
  const formLogs = auditLogs.filter((l: any) => {
    const act = (l.action || "").toUpperCase();
    const type = (l.formType || "").toUpperCase();

    if (formKey === "VERIFICATION") {
      return type === "VERIFICATION" || act.startsWith("VERIFICATION_");
    }
    if (formKey === "ATTENDANCE") {
      return type === "ATTENDANCE" || act.startsWith("ATTENDANCE_");
    }
    if (formKey === "EVALUATION") {
      return (
        type === "EVALUATION" ||
        type === "AFTER_MEETING" ||
        act.startsWith("EVALUATION_") ||
        act.startsWith("AFTER_MEETING_")
      );
    }
    return false;
  });

  // Find specific audit log events for THIS form only
  const submitLog = formLogs.find((l: any) => {
    const act = (l.action || "").toUpperCase();
    return (
      act === `${formKey}_SUBMITTED` ||
      (formKey === "EVALUATION" && act === "AFTER_MEETING_SUBMITTED")
    );
  });

  const forwardStateLog = formLogs.find((l: any) => {
    const act = (l.action || "").toUpperCase();
    return (
      act === `${formKey}_FORWARDED_TO_STATE` ||
      (formKey === "EVALUATION" && act === "AFTER_MEETING_FORWARDED_TO_STATE")
    );
  });

  const forwardAdminLog = formLogs.find((l: any) => {
    const act = (l.action || "").toUpperCase();
    return (
      act === `${formKey}_FORWARDED_TO_ADMIN` ||
      (formKey === "EVALUATION" && act === "AFTER_MEETING_FORWARDED_TO_ADMIN")
    );
  });

  const completeLog = formLogs.find((l: any) => {
    const act = (l.action || "").toUpperCase();
    return (
      act === `${formKey}_COMPLETED` ||
      (formKey === "EVALUATION" && act === "AFTER_MEETING_COMPLETED")
    );
  });

  const rejectLog = formLogs.find((l: any) => {
    const act = (l.action || "").toUpperCase();
    return (
      act === `${formKey}_REJECTED` ||
      (formKey === "EVALUATION" && act === "AFTER_MEETING_REJECTED")
    );
  });

  // Determine which role rejected the form if status is REJECTED
  let rejectRole: "COORDINATOR" | "ZONE_LEADER" | "STATE_LEADER" | "ADMIN" | null = null;
  if (normStatus === "REJECTED" && rejectLog) {
    const actorRole = rejectLog.actor?.role;
    if (actorRole === "ZONE_LEADER") rejectRole = "ZONE_LEADER";
    else if (actorRole === "STATE_LEADER") rejectRole = "STATE_LEADER";
    else if (actorRole === "ADMIN") rejectRole = "ADMIN";
    else rejectRole = "ADMIN";
  }

  // Relevant comment if any
  const latestComment = reviewerComments?.find((c: any) => {
    const cType = (c.formType || "").toUpperCase();
    if (formKey === "VERIFICATION") return cType === "VERIFICATION" || !c.formType;
    if (formKey === "ATTENDANCE") return cType === "ATTENDANCE";
    if (formKey === "EVALUATION") return cType === "EVALUATION" || cType === "AFTER_MEETING";
    return false;
  })?.comment;

  // Determine stage states strictly based on real persisted data
  let stage1State: StageState = "waiting";
  let stage2State: StageState = "waiting";
  let stage3State: StageState = "waiting";
  let stage4State: StageState = "waiting";

  if (isLocked) {
    // If the form is locked (Attendance/Evaluation locked until Verification is completed), all stages are waiting
    stage1State = "waiting";
    stage2State = "waiting";
    stage3State = "waiting";
    stage4State = "waiting";
  } else if (normStatus === "PENDING" || normStatus === "DRAFT") {
    // Not locked, but not submitted yet: Stage 1 is current/in progress
    stage1State = "current";
    stage2State = "waiting";
    stage3State = "waiting";
    stage4State = "waiting";
  } else if (normStatus === "SUBMITTED") {
    stage1State = "completed";
    stage2State = "current";
    stage3State = "waiting";
    stage4State = "waiting";
  } else if (normStatus === "FORWARDED_TO_STATE") {
    stage1State = "completed";
    stage2State = "completed";
    stage3State = "current";
    stage4State = "waiting";
  } else if (normStatus === "FORWARDED_TO_ADMIN") {
    stage1State = "completed";
    stage2State = "completed";
    stage3State = "completed";
    stage4State = "current";
  } else if (normStatus === "COMPLETED" || normStatus === "APPROVED") {
    stage1State = "completed";
    stage2State = "completed";
    stage3State = "completed";
    stage4State = "completed";
  } else if (normStatus === "REJECTED") {
    if (rejectRole === "ZONE_LEADER") {
      stage1State = "completed";
      stage2State = "rejected";
      stage3State = "waiting";
      stage4State = "waiting";
    } else if (rejectRole === "STATE_LEADER") {
      stage1State = "completed";
      stage2State = "completed";
      stage3State = "rejected";
      stage4State = "waiting";
    } else {
      stage1State = "completed";
      stage2State = "completed";
      stage3State = "completed";
      stage4State = "rejected";
    }
  }

  const stage1: WorkflowStageInfo = {
    number: 1,
    roleTitle: "Coordinator",
    stageName: "Form Submission",
    state: stage1State,
    actorName: stage1State === "completed" ? submitLog?.actor?.name || submitLog?.actor?.username || coordinatorName : null,
    actorRole: "COORDINATOR",
    timestamp: stage1State === "completed" ? submitLog?.createdAt || submittedAt || null : null,
    details: isLocked
      ? "Locked — Requires Verification Approval"
      : stage1State === "completed"
      ? "Submitted for review"
      : "Draft / Awaiting Coordinator submission",
  };

  const stage2: WorkflowStageInfo = {
    number: 2,
    roleTitle: "Zonal Leader",
    stageName: "Zone Review & Forward",
    state: stage2State,
    actorName:
      stage2State === "completed"
        ? forwardStateLog?.actor?.name || forwardStateLog?.actor?.username
        : stage2State === "rejected"
        ? rejectLog?.actor?.username
        : null,
    actorRole: "ZONE_LEADER",
    timestamp:
      stage2State === "completed"
        ? forwardStateLog?.createdAt || null
        : stage2State === "rejected"
        ? rejectLog?.createdAt || null
        : null,
    details: isLocked
      ? "Locked — Pending Verification Approval"
      : stage2State === "completed"
      ? "Reviewed & forwarded to State"
      : stage2State === "rejected"
      ? "Returned for corrections by Zonal Leader"
      : stage2State === "current"
      ? "Awaiting Zonal Leader review"
      : "Pending Coordinator submission",
    comment: rejectRole === "ZONE_LEADER" ? latestComment || rejectLog?.details : null,
  };

  const stage3: WorkflowStageInfo = {
    number: 3,
    roleTitle: "State Leader",
    stageName: "State Review & Forward",
    state: stage3State,
    actorName:
      stage3State === "completed"
        ? forwardAdminLog?.actor?.name || forwardAdminLog?.actor?.username
        : stage3State === "rejected"
        ? rejectLog?.actor?.username
        : null,
    actorRole: "STATE_LEADER",
    timestamp:
      stage3State === "completed"
        ? forwardAdminLog?.createdAt || null
        : stage3State === "rejected"
        ? rejectLog?.createdAt || null
        : null,
    details: isLocked
      ? "Locked — Pending Verification Approval"
      : stage3State === "completed"
      ? "Reviewed & forwarded to Admin"
      : stage3State === "rejected"
      ? "Returned for corrections by State"
      : stage3State === "current"
      ? "Awaiting State Leader review"
      : "Pending Zonal Leader review",
    comment: rejectRole === "STATE_LEADER" ? latestComment || rejectLog?.details : null,
  };

  const stage4: WorkflowStageInfo = {
    number: 4,
    roleTitle: "Admin",
    stageName: "Final Decision & Approval",
    state: stage4State,
    actorName:
      stage4State === "completed"
        ? completeLog?.actor?.name || completeLog?.actor?.username || "Admin"
        : stage4State === "rejected"
        ? rejectLog?.actor?.username
        : null,
    actorRole: "ADMIN",
    timestamp:
      stage4State === "completed"
        ? completeLog?.createdAt || approvedAt || null
        : stage4State === "rejected"
        ? rejectLog?.createdAt || rejectedAt || null
        : null,
    details: isLocked
      ? "Locked — Pending Verification Approval"
      : stage4State === "completed"
      ? "Final approval granted • Completed"
      : stage4State === "rejected"
      ? "Rejected / Returned by Admin"
      : stage4State === "current"
      ? "Awaiting final Admin decision"
      : "Pending State Leader review",
    comment: stage4State === "rejected" ? latestComment || rejectLog?.details : null,
  };

  const stages: WorkflowStageInfo[] = [stage1, stage2, stage3, stage4];

  const formatTimestamp = (ts: string | Date | null | undefined) => {
    if (!ts) return null;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Workflow Header Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Sequential Workflow Timeline (Coordinator → Zone → State → Admin)
        </span>
        <span className="text-[10px] font-bold text-foreground/40 font-mono">
          Form: {formType}
        </span>
      </div>

      {/* Stepper Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-accent/25 border border-border/50 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2 relative">
          {stages.map((st, idx) => {
            const isLast = idx === stages.length - 1;
            const formattedTime = formatTimestamp(st.timestamp);

            return (
              <div key={st.number} className="relative flex flex-col justify-between text-left">
                {/* Horizontal connector line on desktop */}
                {!isLast && (
                  <div
                    className={`hidden md:block absolute top-4 left-[calc(50%+18px)] right-[calc(-50%+18px)] h-0.5 z-0 transition-colors ${
                      st.state === "completed"
                        ? "bg-emerald-500/70"
                        : st.state === "rejected"
                        ? "bg-rose-500/50"
                        : "bg-border/60"
                    }`}
                  />
                )}

                {/* Node Top (Icon + Role Badge) */}
                <div className="flex items-center gap-3 relative z-10 mb-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all shadow-xs ${
                      st.state === "completed"
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-500/15"
                        : st.state === "current"
                        ? "bg-primary text-white ring-4 ring-primary/20 animate-pulse"
                        : st.state === "rejected"
                        ? "bg-rose-500 text-white ring-4 ring-rose-500/15"
                        : "bg-foreground/10 text-foreground/40 border border-border/60"
                    }`}
                  >
                    {st.state === "completed" ? (
                      <Check className="h-4 w-4 stroke-3" />
                    ) : st.state === "current" ? (
                      <Clock className="h-4 w-4" />
                    ) : st.state === "rejected" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <span>{st.number}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground/40 block">
                      Stage {st.number}
                    </span>
                    <h5 className="text-xs font-black text-foreground tracking-tight">
                      {st.roleTitle}
                    </h5>
                  </div>
                </div>

                {/* Node Body Details */}
                <div className="pl-11 md:pl-0 space-y-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      st.state === "completed"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : st.state === "current"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        : st.state === "rejected"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : "bg-foreground/5 text-foreground/40 border-border/40"
                    }`}
                  >
                    {st.state === "completed"
                      ? "Completed"
                      : st.state === "current"
                      ? "In Progress"
                      : st.state === "rejected"
                      ? "Returned / Rejected"
                      : "Pending"}
                  </span>

                  <p className="text-[11px] font-medium text-foreground/60 leading-snug">
                    {st.details}
                  </p>

                  {/* Actor name if recorded */}
                  {st.actorName && (st.state === "completed" || st.state === "rejected") && (
                    <span className="text-[10px] font-semibold text-foreground/75 block">
                      by <strong className="text-foreground">{st.actorName}</strong>
                    </span>
                  )}

                  {/* Exact Timestamp */}
                  {formattedTime && (
                    <span className="text-[10px] font-mono text-foreground/50 block">
                      {formattedTime}
                    </span>
                  )}

                  {/* Rejection comment */}
                  {st.comment && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-300 mt-1">
                      <strong>Note:</strong> "{st.comment}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
