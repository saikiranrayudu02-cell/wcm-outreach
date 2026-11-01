"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, FileCheck, ClipboardList, FileSpreadsheet, Lock, CheckCircle2, 
  ArrowUpRight, AlertCircle, Loader2, Send, MessageSquare, History, Pencil, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";
import { WorkflowTimeline } from "@/components/workflow-timeline";

export interface FormTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  currentRole: "COORDINATOR" | "ZONE_LEADER" | "STATE_LEADER" | "ADMIN" | "LEADER";
  currentUsername?: string;
  onUpdated?: () => void;
}

export function FormTrackingModal({
  isOpen,
  onClose,
  reportId,
  currentRole,
  currentUsername,
  onUpdated,
}: FormTrackingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMeeting = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        toast.error("Failed to load meeting details");
        onClose();
      }
    } catch {
      toast.error("An error occurred loading meeting details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && reportId) {
      fetchMeeting();
      setCommentText("");
      setActiveTab(1);
    }
  }, [isOpen, reportId]);

  if (!isOpen || !reportId) return null;

  const handleReviewAction = async (formType: "VERIFICATION" | "ATTENDANCE" | "EVALUATION", action: "FORWARD" | "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !commentText.trim()) {
      toast.error("A comment is required to reject or request corrections.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          action,
          comment: commentText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success(`${formType} Form review recorded successfully`);
      setCommentText("");
      await fetchMeeting();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const vStatus = report?.verificationStatus || report?.verification?.status || "PENDING";
  const aStatus = report?.attendanceStatus || report?.attendance?.status || "PENDING";
  const rStatus = report?.evaluationStatus || report?.report?.status || "PENDING";

  const isAttendanceLocked = vStatus !== "COMPLETED";
  const isEvaluationLocked = vStatus !== "COMPLETED";

  // Check if current user role can review the active form at its current stage
  const canReview = (status: string) => {
    if (currentRole === "ZONE_LEADER") {
      return status === "SUBMITTED";
    }
    if (currentRole === "STATE_LEADER") {
      return status === "FORWARDED_TO_STATE";
    }
    if (currentRole === "ADMIN") {
      return status === "FORWARDED_TO_ADMIN" || status === "SUBMITTED" || status === "FORWARDED_TO_STATE";
    }
    return false;
  };

  const getForwardButtonLabel = () => {
    if (currentRole === "ZONE_LEADER") return "Forward to State Leader";
    if (currentRole === "STATE_LEADER") return "Forward to Admin";
    if (currentRole === "ADMIN") return "Approve & Mark Completed";
    return "Approve";
  };

  const currentFormType: "VERIFICATION" | "ATTENDANCE" | "EVALUATION" =
    activeTab === 1 ? "VERIFICATION" : activeTab === 2 ? "ATTENDANCE" : "EVALUATION";
  const currentStatus = activeTab === 1 ? vStatus : activeTab === 2 ? aStatus : rStatus;
  const isCurrentLocked = activeTab === 2 ? isAttendanceLocked : activeTab === 3 ? isEvaluationLocked : false;

  const currentFormData = activeTab === 1 ? report?.verification : activeTab === 2 ? report?.attendance : report?.report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-h-[92vh] flex flex-col text-left my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-white/5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {report?.reportId || "..."}
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {report?.title || `Outreach Meeting ${report?.reportId}`}
              </h3>
              <span className="inline-flex rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                Status: {report?.status?.replace(/_/g, " ")} (v{report?.version || 1})
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/50 mt-1">
              Coordinator: <strong className="text-white">{report?.leader?.name || report?.leader?.username || report?.coordinatorName || "Coordinator"}</strong>
              {report?.leader?.zone && ` • Zone: ${report?.leader?.zone}`}
              {report?.leader?.state && ` • State: ${report?.leader?.state}`}
              {report?.verification?.district && ` • District: ${report?.verification?.district}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Forms Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-white/5 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab(1)}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 1
                ? "bg-white/10 text-white border-indigo-400 shadow-sm"
                : "text-indigo-200/50 hover:text-white border-transparent"
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span className="truncate">1. Verification</span>
            <FormStatusBadge status={vStatus} size="sm" />
          </button>

          <button
            onClick={() => setActiveTab(2)}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 2
                ? "bg-white/10 text-white border-indigo-400 shadow-sm"
                : "text-indigo-200/50 hover:text-white border-transparent"
            }`}
          >
            {isAttendanceLocked ? <Lock className="h-4 w-4 text-amber-400" /> : <FileSpreadsheet className="h-4 w-4" />}
            <span className="truncate">2. Attendance</span>
            <FormStatusBadge status={aStatus} isLocked={isAttendanceLocked} size="sm" />
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 3
                ? "bg-white/10 text-white border-indigo-400 shadow-sm"
                : "text-indigo-200/50 hover:text-white border-transparent"
            }`}
          >
            {isEvaluationLocked ? <Lock className="h-4 w-4 text-amber-400" /> : <ClipboardList className="h-4 w-4" />}
            <span className="truncate">3. Evaluation</span>
            <FormStatusBadge status={rStatus} isLocked={isEvaluationLocked} size="sm" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading tracking details...</span>
            </div>
          ) : report ? (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. WORKFLOW TIMELINE COMPONENT (Identical across all 3 roles) */}
              <WorkflowTimeline
                formType={currentFormType}
                status={currentStatus}
                isLocked={isCurrentLocked}
                auditLogs={report.auditLogs || []}
                submittedAt={currentFormData?.submittedAt}
                approvedAt={currentFormData?.approvedAt}
                rejectedAt={currentFormData?.rejectedAt}
                coordinatorName={report.leader?.name || report.leader?.username}
                reviewerComments={report.reviewerComments || []}
              />

              {/* 2. Review Action Toolbar (If user has authority to review current form at this stage) */}
              {canReview(currentStatus) && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-indigo-400" />
                      Review Decision Action Required
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300/60 font-bold">
                      Your Role: {currentRole}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Feedback / Remarks / Revision Notes (Required for Rejection)
                    </label>
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add review notes, instructions, or reason for return..."
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReviewAction(currentFormType, "REJECT")}
                      className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? "Processing..." : "Return for Corrections"}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReviewAction(currentFormType, "FORWARD")}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      {getForwardButtonLabel()}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Form Data Details for Active Tab */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                    <FileCheck className="h-4 w-4 text-indigo-400" />
                    Verification Sheet Data
                  </h4>

                  {report.verification ? (
                    <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-semibold">
                      {/* Basic & Meeting */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-2 border-b border-white/10 pb-1">Basic & Meeting Details</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Convener Name</span><span className="text-white font-bold">{report.verification.convenerName || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Church Ministry</span><span className="text-white font-bold">{report.verification.churchMinistryName || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Location</span><span className="text-slate-200">{report.verification.stateDistrictCity || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Contact</span><span className="text-indigo-300">{report.verification.contactNumber || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Dates / Days</span><span className="text-slate-200">{report.verification.meetingDates || "N/A"} ({report.verification.numberOfDays || 0} days)</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Expected Attendance</span><span className="text-emerald-400 font-bold">{report.verification.expectedAttendance || 0} attendees</span></div>
                        </div>
                      </div>

                      {/* Ministry Background */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-2 border-b border-white/10 pb-1">Ministry Background</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Years of Ministry</span><span className="text-white font-bold">{report.verification.yearsOfMinistry || 0} Years</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Church Members</span><span className="text-white font-bold">{report.verification.churchMembers || 0}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Workers & Leaders</span><span className="text-white font-bold">{report.verification.workersLeaders || 0}</span></div>
                        </div>
                      </div>

                      {/* WCM Connection */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-2 border-b border-white/10 pb-1">WCM Connection</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Know About WCM</span><span className="text-slate-200">{report.verification.knowAboutWcm || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Read WCM Books?</span><span className="text-white font-bold">{report.verification.readWcmBooks ? "Yes" : "No"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Attended Prophet Kiran Meeting?</span><span className="text-white font-bold">{report.verification.attendedProphetMeeting ? "Yes" : "No"}</span></div>
                        </div>
                      </div>

                      {/* Arrangements */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-2 border-b border-white/10 pb-1">Arrangements</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Hall & Stage</span><span className="text-slate-200">{report.verification.meetingHallStage || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Sound System</span><span className="text-slate-200">{report.verification.soundSystem || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Accommodation</span><span className="text-slate-200">{report.verification.accommodationTeam || "N/A"}</span></div>
                          <div><span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Volunteer Support</span><span className="text-slate-200">{report.verification.volunteerSupport || "N/A"}</span></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No verification sheet entered yet.</p>
                  )}
                </div>
              )}

              {activeTab === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                    <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                    Attendance Record Data
                  </h4>

                  {isAttendanceLocked ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
                      <Lock className="h-4 w-4 shrink-0" />
                      <span>This form is locked until the Verification Form completes the approval sequence and receives final approval.</span>
                    </div>
                  ) : report.attendance ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs bg-white/5 border border-white/10 rounded-xl p-4 font-semibold">
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Meeting Date</span><span className="text-white font-bold">{new Date(report.attendance.date).toLocaleDateString()}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Location</span><span className="text-white font-bold">{report.attendance.location || "N/A"}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Field Executer</span><span className="text-slate-200">{report.attendance.fieldExecuter || "N/A"}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Coordinator</span><span className="text-slate-200">{report.attendance.coordinator || "N/A"}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Members Attended</span><span className="text-emerald-400 font-bold">{report.attendance.membersAttended || 0}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Pastors Attended</span><span className="text-indigo-400 font-bold">{report.attendance.pastorsAttended || 0}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Total Attended</span><span className="text-white font-black text-sm">{(report.attendance.membersAttended || 0) + (report.attendance.pastorsAttended || 0)}</span></div>
                      <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Remarks</span><p className="text-slate-200 whitespace-pre-wrap">{report.attendance.remarks || "None"}</p></div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No attendance record submitted yet.</p>
                  )}
                </div>
              )}

              {activeTab === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                    <ClipboardList className="h-4 w-4 text-indigo-400" />
                    After-Meeting Evaluation Data
                  </h4>

                  {isEvaluationLocked ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
                      <Lock className="h-4 w-4 shrink-0" />
                      <span>This form is locked until the Verification Form completes the approval sequence and receives final approval.</span>
                    </div>
                  ) : report.report ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white/5 border border-white/10 rounded-xl p-4 font-semibold">
                      <div className="sm:col-span-2"><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Overall Outcome</span><p className="text-white font-bold">{report.report.overallMeetingOutcome || "N/A"}</p></div>
                      <div className="sm:col-span-2"><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Congregation Response</span><p className="text-slate-200">{report.report.congregationResponse || "N/A"}</p></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Continue Fellowship?</span><span className="text-white font-bold">{report.report.continueFellowship ? "Yes" : "No"}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Following WCM Members</span><span className="text-indigo-400 font-bold">{report.report.followingWcmMembersCount || 0}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Local Church Influence</span><span className="text-slate-200">{report.report.localChurchInfluence || "N/A"}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Network of Pastors</span><span className="text-slate-200">{report.report.networkOfPastors || "N/A"}</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Strengths</span><p className="text-slate-200 whitespace-pre-wrap">{report.report.strengthsObserved || "None"}</p></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Challenges</span><p className="text-slate-200 whitespace-pre-wrap">{report.report.challengesObserved || "None"}</p></div>
                      <div className="sm:col-span-2"><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Opportunity for WCM</span><p className="text-slate-200 whitespace-pre-wrap">{report.report.opportunityForWcm || "None"}</p></div>
                      <div className="sm:col-span-2"><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Future Opportunities</span><p className="text-slate-200">{report.report.futureOpportunities?.join(", ") || "None"}</p></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Coordinator</span><span className="text-white font-bold">{report.report.coordinatorName || "N/A"} ({report.report.designation || "N/A"})</span></div>
                      <div><span className="text-slate-400 uppercase block font-black text-[9px] tracking-wider mb-0.5">Signature</span><span className="font-mono text-indigo-300 font-bold">{report.report.signature || "N/A"}</span></div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No evaluation report submitted yet.</p>
                  )}
                </div>
              )}

              {/* 4. Complete Activity Log & Audit History */}
              <div className="space-y-3 pt-2">
                <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-indigo-400" />
                  Complete Activity Log & Audit History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {report.auditLogs && report.auditLogs.length > 0 ? (
                    report.auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="text-xs font-semibold text-slate-300 flex flex-col sm:flex-row justify-between gap-1 p-2.5 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div>
                          <strong className="text-white font-bold">{log.action?.replace(/_/g, " ")}:</strong>{" "}
                          <span className="text-slate-300">{log.details}</span>
                          {log.actor && (
                            <span className="text-[10px] text-indigo-300/80 block mt-0.5">
                              Actor: {log.actor.username} ({log.actor.role})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 self-start sm:self-center">
                          {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}{" "}
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No audit records logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5 shrink-0">
          <div>
            {(currentRole === "COORDINATOR" || currentRole === "LEADER") && report && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/coordinator/report/${report.id}`);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                Open Form Editor
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
