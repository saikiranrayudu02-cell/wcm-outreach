"use client";

import React, { useEffect, useState } from "react";
import { 
  X, FileCheck, ClipboardList, FileSpreadsheet, Lock, CheckCircle2, 
  ArrowUpRight, AlertCircle, Loader2, Send, MessageSquare 
} from "lucide-react";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";

interface MeetingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  role: "ZONE_LEADER" | "STATE_LEADER" | "ADMIN";
  username: string;
  onUpdated?: () => void;
}

export function MeetingReviewModal({
  isOpen,
  onClose,
  reportId,
  role,
  username,
  onUpdated,
}: MeetingReviewModalProps) {
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
      toast.error("An error occurred loading meeting");
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
      toast.error("A comment is required to reject a form.");
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

  // Check if current user role can review a form at its current stage
  const canReview = (status: string) => {
    if (role === "ZONE_LEADER") {
      return status === "SUBMITTED";
    }
    if (role === "STATE_LEADER") {
      return status === "FORWARDED_TO_STATE";
    }
    if (role === "ADMIN") {
      return status === "FORWARDED_TO_ADMIN" || status === "SUBMITTED" || status === "FORWARDED_TO_STATE";
    }
    return false;
  };

  const getForwardButtonLabel = () => {
    if (role === "ZONE_LEADER") return "Forward to State Leader";
    if (role === "STATE_LEADER") return "Forward to Admin";
    if (role === "ADMIN") return "Approve & Mark Completed";
    return "Approve";
  };

  const comments = report?.reviewerComments || [];
  const vComments = comments.filter((c: any) => c.formType === "VERIFICATION" || !c.formType);
  const aComments = comments.filter((c: any) => c.formType === "ATTENDANCE");
  const rComments = comments.filter((c: any) => c.formType === "EVALUATION" || c.formType === "AFTER_MEETING");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-h-[92vh] flex flex-col text-left my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {report?.reportId || "..."}
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {report?.title || `Outreach Meeting ${report?.reportId}`}
              </h3>
            </div>
            <p className="text-[11px] text-indigo-200/50 mt-1">
              Coordinator: <strong className="text-white">{report?.leader?.username || report?.coordinatorName}</strong>
              {report?.leader?.zone && ` • Zone: ${report?.leader?.zone}`}
              {report?.leader?.state && ` • State: ${report?.leader?.state}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Forms Tabs */}
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
              <span className="text-xs font-bold uppercase tracking-wider">Loading form details...</span>
            </div>
          ) : report ? (
            <>
              {/* TAB 1: VERIFICATION SHEET */}
              {activeTab === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <FileCheck className="h-4.5 w-4.5 text-indigo-400" />
                        Verification Sheet — Complete Record
                      </h4>
                      {report.verification?.submittedAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Submitted on: <strong className="text-slate-300">{new Date(report.verification.submittedAt).toLocaleDateString()} {new Date(report.verification.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </span>
                      )}
                    </div>
                    <FormStatusBadge status={vStatus} />
                  </div>

                  {report.verification ? (
                    <div className="space-y-4">
                      {/* Section 1: Basic & Meeting Details */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                          <span>1. Basic & Meeting Details</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Convener Name</span>
                            <p className="font-bold text-white text-sm">{report.verification.convenerName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Church / Ministry Name</span>
                            <p className="font-bold text-white text-sm">{report.verification.churchMinistryName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Location (State/Dist/City)</span>
                            <p className="font-semibold text-slate-200">{report.verification.stateDistrictCity || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Contact Number</span>
                            <p className="font-semibold text-indigo-300">{report.verification.contactNumber || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Meeting Dates</span>
                            <p className="font-semibold text-slate-200">{report.verification.meetingDates || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Duration (Days)</span>
                            <p className="font-semibold text-slate-200">{report.verification.numberOfDays || 0} Day(s)</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Expected Attendance</span>
                            <p className="font-bold text-emerald-400 text-sm">{report.verification.expectedAttendance || 0} People</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Ministry Background */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                          <span>2. Ministry Background</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Years of Ministry</span>
                            <p className="font-bold text-white text-sm">{report.verification.yearsOfMinistry || 0} Years</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Total Church Members</span>
                            <p className="font-bold text-white text-sm">{report.verification.churchMembers || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Workers & Leaders</span>
                            <p className="font-bold text-white text-sm">{report.verification.workersLeaders || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: WCM Connection */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                          <span>3. WCM Connection</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">How they know about WCM</span>
                            <p className="font-semibold text-slate-200">{report.verification.knowAboutWcm || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Read WCM Books?</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                              report.verification.readWcmBooks ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-700 text-slate-300"
                            }`}>
                              {report.verification.readWcmBooks ? "Yes" : "No"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Attended Prophet Kiran Meeting?</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                              report.verification.attendedProphetMeeting ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-700 text-slate-300"
                            }`}>
                              {report.verification.attendedProphetMeeting ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Arrangements & Facilities */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                          <span>4. Arrangements & Facilities</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Meeting Hall / Stage</span>
                            <p className="font-semibold text-slate-200">{report.verification.meetingHallStage || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Sound System</span>
                            <p className="font-semibold text-slate-200">{report.verification.soundSystem || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Accommodation Team</span>
                            <p className="font-semibold text-slate-200">{report.verification.accommodationTeam || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Volunteer Support</span>
                            <p className="font-semibold text-slate-200">{report.verification.volunteerSupport || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Verification form not filled yet.</p>
                  )}

                  {/* Comments for Verification */}
                  {vComments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Comments</span>
                      <div className="space-y-1.5">
                        {vComments.map((c: any, i: number) => (
                          <div key={i} className="text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-indigo-200/80">
                            <span className="font-bold text-white block text-[10px] uppercase">{c.reviewer?.username || "Reviewer"}</span>
                            "{c.comment}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Action Controls */}
                  {canReview(vStatus) && (
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4">
                      <h5 className="text-xs font-black text-white uppercase tracking-wider">
                        Action Required: Review Verification Form
                      </h5>
                      <textarea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Feedback or reason (required if rejecting)..."
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                      />
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleReviewAction("VERIFICATION", "REJECT")}
                          disabled={submitting}
                          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-rose-500/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReviewAction("VERIFICATION", role === "ADMIN" ? "APPROVE" : "FORWARD")}
                          disabled={submitting}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : getForwardButtonLabel()}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ATTENDANCE RECORD */}
              {activeTab === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-400" />
                        Attendance Form — Complete Record
                      </h4>
                      {report.attendance?.submittedAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Submitted on: <strong className="text-slate-300">{new Date(report.attendance.submittedAt).toLocaleDateString()} {new Date(report.attendance.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </span>
                      )}
                    </div>
                    <FormStatusBadge status={aStatus} isLocked={isAttendanceLocked} />
                  </div>

                  {isAttendanceLocked ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-3">
                      <Lock className="h-8 w-8 text-amber-400 mx-auto" />
                      <h5 className="text-sm font-bold text-white uppercase tracking-wider">Attendance Form Locked</h5>
                      <p className="text-xs text-indigo-200/70 max-w-md mx-auto">
                        This form is locked until the Verification Form completes the full approval sequence and receives final Admin approval.
                      </p>
                      <div className="inline-flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400">Current Verification Status:</span>
                        <FormStatusBadge status={vStatus} size="sm" />
                      </div>
                    </div>
                  ) : report.attendance ? (
                    <div className="space-y-4">
                      {/* Attendance Details Grid */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5">
                          Session & Attendance Numbers
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Meeting Date</span>
                            <p className="font-bold text-white text-sm">{new Date(report.attendance.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Location / Venue</span>
                            <p className="font-bold text-white text-sm">{report.attendance.location || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Field Executer</span>
                            <p className="font-semibold text-indigo-200">{report.attendance.fieldExecuter || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Coordinator</span>
                            <p className="font-semibold text-indigo-200">{report.attendance.coordinator || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Members Attended</span>
                            <p className="font-black text-emerald-400 text-base">{report.attendance.membersAttended || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Pastors Attended</span>
                            <p className="font-black text-indigo-300 text-base">{report.attendance.pastorsAttended || 0}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Total Headcount</span>
                            <p className="font-black text-white text-base">
                              {(Number(report.attendance.membersAttended) || 0) + (Number(report.attendance.pastorsAttended) || 0)} Total
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                        <span className="text-slate-400 uppercase text-[9px] font-bold block">Coordinator Remarks & Observations</span>
                        <p className="font-semibold text-slate-200 text-xs whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                          {report.attendance.remarks || "No remarks entered."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Attendance form not submitted yet.</p>
                  )}

                  {/* Comments */}
                  {aComments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Comments</span>
                      <div className="space-y-1.5">
                        {aComments.map((c: any, i: number) => (
                          <div key={i} className="text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-indigo-200/80">
                            <span className="font-bold text-white block text-[10px] uppercase">{c.reviewer?.username || "Reviewer"}</span>
                            "{c.comment}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Action Controls */}
                  {!isAttendanceLocked && canReview(aStatus) && (
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4">
                      <h5 className="text-xs font-black text-white uppercase tracking-wider">
                        Action Required: Review Attendance Form
                      </h5>
                      <textarea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Feedback or reason (required if rejecting)..."
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                      />
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleReviewAction("ATTENDANCE", "REJECT")}
                          disabled={submitting}
                          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-rose-500/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReviewAction("ATTENDANCE", role === "ADMIN" ? "APPROVE" : "FORWARD")}
                          disabled={submitting}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : getForwardButtonLabel()}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AFTER-MEETING EVALUATION */}
              {activeTab === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <ClipboardList className="h-4.5 w-4.5 text-indigo-400" />
                        After-Meeting Evaluation — Complete Record
                      </h4>
                      {report.report?.submittedAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Submitted on: <strong className="text-slate-300">{new Date(report.report.submittedAt).toLocaleDateString()} {new Date(report.report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </span>
                      )}
                    </div>
                    <FormStatusBadge status={rStatus} isLocked={isEvaluationLocked} />
                  </div>

                  {isEvaluationLocked ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-3">
                      <Lock className="h-8 w-8 text-amber-400 mx-auto" />
                      <h5 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation Form Locked</h5>
                      <p className="text-xs text-indigo-200/70 max-w-md mx-auto">
                        This form is locked until the Verification Form completes the full approval sequence and receives final Admin approval.
                      </p>
                      <div className="inline-flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400">Current Verification Status:</span>
                        <FormStatusBadge status={vStatus} size="sm" />
                      </div>
                    </div>
                  ) : report.report ? (
                    <div className="space-y-4">
                      {/* Meeting Outcomes & Response */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5">
                          1. Outcomes & Fellowship
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Overall Meeting Outcome</span>
                            <p className="font-bold text-white text-sm">{report.report.overallMeetingOutcome || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Congregation Response</span>
                            <p className="font-bold text-white text-sm">{report.report.congregationResponse || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Desire to Continue Fellowship</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                              report.report.continueFellowship ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-700 text-slate-300"
                            }`}>
                              {report.report.continueFellowship ? "Yes, Highly Interested" : "No / Undecided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Following WCM Members Count</span>
                            <p className="font-black text-indigo-300 text-sm">{report.report.followingWcmMembersCount || 0} Members</p>
                          </div>
                        </div>
                      </div>

                      {/* Church Influence & Network */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5">
                          2. Church Influence & Network
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Local Church Influence</span>
                            <p className="font-semibold text-slate-200">{report.report.localChurchInfluence || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Network of Pastors</span>
                            <p className="font-semibold text-slate-200">{report.report.networkOfPastors || "N/A"}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-1">Future Opportunities for WCM</span>
                            {Array.isArray(report.report.futureOpportunities) && report.report.futureOpportunities.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {report.report.futureOpportunities.map((op: string, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 font-bold text-[10px]">
                                    {op}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-[11px]">None specified</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Strengths & Observations */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5">
                          3. Observations & Strategic Opportunities
                        </h5>
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-1">Strengths Observed</span>
                            <p className="font-semibold text-slate-200 bg-black/20 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                              {report.report.strengthsObserved || "None"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-1">Challenges Observed</span>
                            <p className="font-semibold text-slate-200 bg-black/20 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                              {report.report.challengesObserved || "None"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-1">Specific Opportunity for WCM</span>
                            <p className="font-semibold text-emerald-300 bg-black/20 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                              {report.report.opportunityForWcm || "None"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sign-off & Submission */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-1.5">
                          4. Sign-Off & Verification
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Coordinator Name</span>
                            <p className="font-bold text-white text-sm">{report.report.coordinatorName || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Designation</span>
                            <p className="font-semibold text-slate-200">{report.report.designation || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Digital Signature</span>
                            <p className="font-mono font-bold text-indigo-300 text-sm bg-black/30 px-2 py-1 rounded border border-white/10">{report.report.signature || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] font-bold block mb-0.5">Submission Date</span>
                            <p className="font-semibold text-slate-300">
                              {report.report.submissionDate ? new Date(report.report.submissionDate).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Evaluation form not submitted yet.</p>
                  )}

                  {/* Comments */}
                  {rComments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Comments</span>
                      <div className="space-y-1.5">
                        {rComments.map((c: any, i: number) => (
                          <div key={i} className="text-xs p-3 rounded-xl bg-white/5 border border-white/5 text-indigo-200/80">
                            <span className="font-bold text-white block text-[10px] uppercase">{c.reviewer?.username || "Reviewer"}</span>
                            "{c.comment}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Action Controls */}
                  {!isEvaluationLocked && canReview(rStatus) && (
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4">
                      <h5 className="text-xs font-black text-white uppercase tracking-wider">
                        Action Required: Review Evaluation Form
                      </h5>
                      <textarea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Feedback or reason (required if rejecting)..."
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                      />
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleReviewAction("EVALUATION", "REJECT")}
                          disabled={submitting}
                          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-rose-500/30"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReviewAction("EVALUATION", role === "ADMIN" ? "APPROVE" : "FORWARD")}
                          disabled={submitting}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : getForwardButtonLabel()}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
