"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileCheck, ClipboardList, FileSpreadsheet, Save, Send, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, Lock, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { FormStatusBadge } from "@/components/form-status-badge";

export default function MeetingReportWizardPage() {
  const router = useRouter();
  const { id: reportId } = useParams() as { id: string };
  const { language } = useUIStore();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingForm, setSubmittingForm] = useState<string | null>(null);
  const [reportNumber, setReportNumber] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [vStatus, setVStatus] = useState("PENDING");
  const [aStatus, setAStatus] = useState("PENDING");
  const [rStatus, setRStatus] = useState("PENDING");
  const [comments, setComments] = useState<any[]>([]);

  // Section 1: Verification Form State
  const [vForm, setVForm] = useState({
    convenerName: "",
    churchMinistryName: "",
    stateDistrictCity: "",
    contactNumber: "",
    meetingDates: "",
    numberOfDays: 1,
    expectedAttendance: 100,
    yearsOfMinistry: 0,
    churchMembers: 0,
    workersLeaders: 0,
    knowAboutWcm: "Other Church Ministers",
    readWcmBooks: false,
    attendedProphetMeeting: false,
    meetingHallStage: "Arranged By Host",
    soundSystem: "Arranged By Host",
    accommodationTeam: "Arranged By Host",
    volunteerSupport: "Arranged By Host",
  });

  // Section 2: Attendance Form State
  const [aForm, setAForm] = useState({
    date: new Date().toISOString().split("T")[0],
    location: "",
    fieldExecuter: "",
    coordinator: "",
    membersAttended: 0,
    pastorsAttended: 0,
    remarks: "",
  });

  // Section 3: After Meeting Form State
  const [rForm, setRForm] = useState({
    overallMeetingOutcome: "",
    congregationResponse: "",
    continueFellowship: false,
    futureOpportunities: [] as string[],
    localChurchInfluence: "",
    networkOfPastors: "",
    strengthsObserved: "",
    challengesObserved: "",
    opportunityForWcm: "",
    coordinatorName: "",
    designation: "",
    signature: "",
    submissionDate: new Date().toISOString().split("T")[0],
    followingWcmMembersCount: 0,
  });

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setReportNumber(data.reportId);
      setReportTitle(data.title || `Outreach Meeting ${data.reportId}`);
      setReportStatus(data.status);
      setVStatus(data.verificationStatus || data.verification?.status || "PENDING");
      setAStatus(data.attendanceStatus || data.attendance?.status || "PENDING");
      setRStatus(data.evaluationStatus || data.report?.status || "PENDING");
      setComments(data.reviewerComments || []);

      if (data.verification) {
        setVForm((prev) => ({ ...prev, ...data.verification }));
      }
      if (data.attendance) {
        const dateStr = data.attendance.date 
          ? new Date(data.attendance.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        setAForm((prev) => ({ ...prev, ...data.attendance, date: dateStr }));
      }
      if (data.report) {
        const subDateStr = data.report.submissionDate 
          ? new Date(data.report.submissionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        setRForm((prev) => ({ ...prev, ...data.report, submissionDate: subDateStr }));
      }
    } catch (err) {
      toast.error("Failed to load meeting forms");
      router.push("/coordinator/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const isAttendanceLocked = vStatus !== "COMPLETED";
  const isEvaluationLocked = vStatus !== "COMPLETED";

  // Form Validation checks
  const checkVComplete = () => {
    return (
      vForm.convenerName.trim() !== "" &&
      vForm.churchMinistryName.trim() !== "" &&
      vForm.churchMinistryName !== "Not Specified" &&
      vForm.stateDistrictCity.trim() !== "" &&
      vForm.stateDistrictCity !== "Not Specified" &&
      vForm.contactNumber.trim() !== "" &&
      vForm.contactNumber !== "Not Specified" &&
      vForm.meetingDates.trim() !== "" &&
      vForm.numberOfDays > 0 &&
      vForm.expectedAttendance > 0
    );
  };

  const checkAComplete = () => {
    return (
      aForm.location.trim() !== "" &&
      aForm.fieldExecuter.trim() !== "" &&
      aForm.coordinator.trim() !== "" &&
      (aForm.membersAttended > 0 || aForm.pastorsAttended > 0) &&
      aForm.remarks.trim() !== ""
    );
  };

  const checkRComplete = () => {
    return (
      rForm.overallMeetingOutcome.trim() !== "" &&
      rForm.congregationResponse.trim() !== "" &&
      rForm.coordinatorName.trim() !== "" &&
      rForm.designation.trim() !== "" &&
      rForm.signature.trim() !== "" &&
      rForm.strengthsObserved.trim() !== "" &&
      rForm.challengesObserved.trim() !== "" &&
      rForm.opportunityForWcm.trim() !== ""
    );
  };

  // Completion percentages
  const getVPercent = () => {
    let score = 0;
    if (vForm.convenerName.trim()) score++;
    if (vForm.churchMinistryName.trim()) score++;
    if (vForm.stateDistrictCity.trim()) score++;
    if (vForm.contactNumber.trim()) score++;
    if (vForm.meetingDates.trim()) score++;
    if (vForm.numberOfDays > 0) score++;
    if (vForm.expectedAttendance > 0) score++;
    if (vForm.yearsOfMinistry > 0) score++;
    if (vForm.churchMembers > 0) score++;
    if (vForm.workersLeaders > 0) score++;
    return Math.round((score / 10) * 100);
  };

  const getAPercent = () => {
    let score = 0;
    if (aForm.location.trim()) score++;
    if (aForm.fieldExecuter.trim()) score++;
    if (aForm.coordinator.trim()) score++;
    if (aForm.membersAttended > 0) score++;
    if (aForm.pastorsAttended > 0) score++;
    if (aForm.remarks.trim()) score++;
    return Math.round((score / 6) * 100);
  };

  const getRPercent = () => {
    let score = 0;
    if (rForm.overallMeetingOutcome.trim()) score++;
    if (rForm.congregationResponse.trim()) score++;
    if (rForm.coordinatorName.trim()) score++;
    if (rForm.designation.trim()) score++;
    if (rForm.signature.trim()) score++;
    if (rForm.strengthsObserved.trim()) score++;
    if (rForm.challengesObserved.trim()) score++;
    if (rForm.opportunityForWcm.trim()) score++;
    return Math.round((score / 8) * 100);
  };

  // Save specific form draft
  const handleSaveForm = async (formType: "VERIFICATION" | "ATTENDANCE" | "EVALUATION") => {
    setSaving(true);
    try {
      const payload: any = {};
      if (formType === "VERIFICATION") payload.verification = vForm;
      if (formType === "ATTENDANCE") payload.attendance = aForm;
      if (formType === "EVALUATION") payload.report = rForm;

      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to save ${formType} draft`);
      }

      toast.success(`${formType.replace(/_/g, " ")} draft saved successfully`);
      await fetchReport();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Submit specific form
  const handleSubmitForm = async (formType: "VERIFICATION" | "ATTENDANCE" | "EVALUATION") => {
    if (formType === "VERIFICATION" && !checkVComplete()) {
      toast.error("Please fill all required Verification Form fields.");
      return;
    }
    if (formType === "ATTENDANCE" && !checkAComplete()) {
      toast.error("Please fill all required Attendance Form fields.");
      return;
    }
    if (formType === "EVALUATION" && !checkRComplete()) {
      toast.error("Please fill all required After-Meeting Evaluation fields.");
      return;
    }

    setSubmittingForm(formType);
    try {
      // 1. Auto save draft first
      const payload: any = {};
      if (formType === "VERIFICATION") payload.verification = vForm;
      if (formType === "ATTENDANCE") payload.attendance = aForm;
      if (formType === "EVALUATION") payload.report = rForm;

      const saveRes = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json();
        throw new Error(saveErr.error || "Failed to save updates before submission.");
      }

      // 2. Submit form to trigger approval workflow
      const submitRes = await fetch(`/api/reports/${reportId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType }),
      });

      if (!submitRes.ok) {
        const errData = await submitRes.json();
        throw new Error(errData.error || `Failed to submit ${formType}`);
      }

      toast.success(`${formType.replace(/_/g, " ")} submitted successfully for review`);
      await fetchReport();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during submission");
    } finally {
      setSubmittingForm(null);
    }
  };

  // Submit both Attendance & Evaluation in the same session
  const handleSubmitBoth = async () => {
    if (!checkAComplete() || !checkRComplete()) {
      toast.error("Please fill all required fields in both Attendance and Evaluation forms.");
      return;
    }

    setSubmittingForm("BOTH");
    try {
      // 1. Save both forms
      const saveRes = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance: aForm,
          report: rForm,
        }),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json();
        throw new Error(saveErr.error || "Failed to save forms.");
      }

      // 2. Submit Attendance
      const submitARes = await fetch(`/api/reports/${reportId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "ATTENDANCE" }),
      });

      if (!submitARes.ok) {
        const errA = await submitARes.json();
        throw new Error(errA.error || "Failed to submit Attendance Form");
      }

      // 3. Submit Evaluation
      const submitRRes = await fetch(`/api/reports/${reportId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "EVALUATION" }),
      });

      if (!submitRRes.ok) {
        const errR = await submitRRes.json();
        throw new Error(errR.error || "Failed to submit Evaluation Form");
      }

      toast.success("Both Attendance and Evaluation Forms submitted successfully!");
      await fetchReport();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while submitting both forms.");
    } finally {
      setSubmittingForm(null);
    }
  };

  const toggleFutureOpportunity = (opportunity: string) => {
    setRForm((prev) => {
      const ops = prev.futureOpportunities.includes(opportunity)
        ? prev.futureOpportunities.filter((o) => o !== opportunity)
        : [...prev.futureOpportunities, opportunity];
      return { ...prev, futureOpportunities: ops };
    });
  };

  const opportunitiesList = [
    "Monthly Meeting",
    "Youth Meeting",
    "Women Meeting",
    "Pastor Meeting",
    "Couple Meeting",
    "Kids Meeting",
    "Fasting Prayer",
    "Vigil Prayer",
    "Special Event",
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Loading meeting forms...</span>
        </div>
      </DashboardLayout>
    );
  }

  const vComments = comments.filter((c) => c.formType === "VERIFICATION" || !c.formType);
  const aComments = comments.filter((c) => c.formType === "ATTENDANCE");
  const rComments = comments.filter((c) => c.formType === "EVALUATION" || c.formType === "AFTER_MEETING");

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12 text-left animate-fadeIn">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => router.push("/coordinator/dashboard")}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Meeting Overview Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black tracking-wider border border-indigo-500/30">
                  {reportNumber}
                </span>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  {reportTitle}
                </h2>
              </div>
              <p className="text-xs text-indigo-200/60 font-medium mt-1">
                One meeting with three linked lifecycle forms: Verification → Attendance → Evaluation
              </p>
            </div>

            {/* Quick Status Badges for all 3 forms */}
            <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">1. Verification</span>
                <FormStatusBadge status={vStatus} size="sm" />
              </div>
              <div className="h-6 w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">2. Attendance</span>
                <FormStatusBadge status={aStatus} isLocked={isAttendanceLocked} size="sm" />
              </div>
              <div className="h-6 w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">3. Evaluation</span>
                <FormStatusBadge status={rStatus} isLocked={isEvaluationLocked} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Forms Navigation Tabs */}
        <div className="grid grid-cols-3 border border-white/10 bg-white/5 p-1.5 rounded-2xl gap-2">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-12 ${
              activeStep === 1 
                ? "bg-white/15 text-white shadow-sm border border-indigo-400/30" 
                : "text-indigo-200/50 hover:text-white"
            }`}
          >
            <FileCheck className={`h-4.5 w-4.5 ${activeStep === 1 ? "text-indigo-300" : "text-slate-400"}`} />
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <span>1. Verification</span>
              <span className="text-[9px] opacity-70">({getVPercent()}%)</span>
            </div>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-12 ${
              activeStep === 2 
                ? "bg-white/15 text-white shadow-sm border border-indigo-400/30" 
                : "text-indigo-200/50 hover:text-white"
            }`}
          >
            {isAttendanceLocked ? (
              <Lock className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <FileSpreadsheet className={`h-4.5 w-4.5 ${activeStep === 2 ? "text-indigo-300" : "text-slate-400"}`} />
            )}
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <span>2. Attendance</span>
              <span className="text-[9px] opacity-70">
                {isAttendanceLocked ? "Locked" : `(${getAPercent()}%)`}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-12 ${
              activeStep === 3 
                ? "bg-white/15 text-white shadow-sm border border-indigo-400/30" 
                : "text-indigo-200/50 hover:text-white"
            }`}
          >
            {isEvaluationLocked ? (
              <Lock className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <ClipboardList className={`h-4.5 w-4.5 ${activeStep === 3 ? "text-indigo-300" : "text-slate-400"}`} />
            )}
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <span>3. Evaluation</span>
              <span className="text-[9px] opacity-70">
                {isEvaluationLocked ? "Locked" : `(${getRPercent()}%)`}
              </span>
            </div>
          </button>
        </div>

        {/* STEP 1: VERIFICATION SHEET */}
        {activeStep === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  1. Verification Form (Pre-Meeting Approval)
                </h3>
                <p className="text-xs text-indigo-200/60 mt-0.5">
                  Must be submitted and approved by Admin to unlock the Attendance and Evaluation forms.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FormStatusBadge status={vStatus} />
              </div>
            </div>

            {/* Rejection Notice & Comments if rejected */}
            {vStatus === "REJECTED" && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4" />
                  <span>Verification Form Returned for Corrections</span>
                </div>
                {vComments.length > 0 && (
                  <div className="text-xs text-rose-200/90 pl-6 space-y-1">
                    {vComments.map((c, i) => (
                      <p key={i}>"{c.comment}"</p>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-rose-300/70 pl-6">
                  Please update the highlighted information and re-submit for review.
                </p>
              </div>
            )}

            {/* Verification Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Convener Name *
                </label>
                <input
                  type="text"
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.convenerName}
                  onChange={(e) => setVForm({ ...vForm, convenerName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  placeholder="Convener / Host Pastor"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Church / Ministry Name *
                </label>
                <input
                  type="text"
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.churchMinistryName}
                  onChange={(e) => setVForm({ ...vForm, churchMinistryName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  placeholder="Church name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  State / District / City *
                </label>
                <input
                  type="text"
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.stateDistrictCity}
                  onChange={(e) => setVForm({ ...vForm, stateDistrictCity: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  placeholder="e.g. Hyderabad, Telangana"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Contact Number *
                </label>
                <input
                  type="text"
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.contactNumber}
                  onChange={(e) => setVForm({ ...vForm, contactNumber: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Meeting Dates *
                </label>
                <input
                  type="text"
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.meetingDates}
                  onChange={(e) => setVForm({ ...vForm, meetingDates: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  placeholder="e.g. Nov 15-17, 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Days *
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                    value={vForm.numberOfDays}
                    onChange={(e) => setVForm({ ...vForm, numberOfDays: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Expected Attendance *
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                    value={vForm.expectedAttendance}
                    onChange={(e) => setVForm({ ...vForm, expectedAttendance: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Years of Ministry
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.yearsOfMinistry}
                  onChange={(e) => setVForm({ ...vForm, yearsOfMinistry: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Church Members
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.churchMembers}
                  onChange={(e) => setVForm({ ...vForm, churchMembers: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Workers & Leaders
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                  value={vForm.workersLeaders}
                  onChange={(e) => setVForm({ ...vForm, workersLeaders: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-2 pt-3 border-t border-white/10">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 block mb-3">
                  WCM Connection & Background
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      How they know about WCM
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.knowAboutWcm}
                      onChange={(e) => setVForm({ ...vForm, knowAboutWcm: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="YouTube Messages" className="bg-slate-900">YouTube Messages</option>
                      <option value="WCM Books" className="bg-slate-900">WCM Books</option>
                      <option value="Friends / Relatives" className="bg-slate-900">Friends / Relatives</option>
                      <option value="Church Leaders" className="bg-slate-900">Church Leaders</option>
                      <option value="Other Church Ministers" className="bg-slate-900">Other Church Ministers</option>
                      <option value="Social Media" className="bg-slate-900">Social Media</option>
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Read WCM Books?
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.readWcmBooks ? "true" : "false"}
                      onChange={(e) => setVForm({ ...vForm, readWcmBooks: e.target.value === "true" })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="true" className="bg-slate-900">Yes</option>
                      <option value="false" className="bg-slate-900">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Attended Prophet Kiran Meeting?
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.attendedProphetMeeting ? "true" : "false"}
                      onChange={(e) => setVForm({ ...vForm, attendedProphetMeeting: e.target.value === "true" })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="true" className="bg-slate-900">Yes</option>
                      <option value="false" className="bg-slate-900">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 pt-3 border-t border-white/10">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 block mb-3">
                  Meeting Arrangements & Facilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Meeting Hall / Stage
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.meetingHallStage}
                      onChange={(e) => setVForm({ ...vForm, meetingHallStage: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="Good" className="bg-slate-900">Good</option>
                      <option value="Average" className="bg-slate-900">Average</option>
                      <option value="Poor" className="bg-slate-900">Poor</option>
                      <option value="Arranged By Host" className="bg-slate-900">Arranged By Host</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Sound System
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.soundSystem}
                      onChange={(e) => setVForm({ ...vForm, soundSystem: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="Good" className="bg-slate-900">Good</option>
                      <option value="Average" className="bg-slate-900">Average</option>
                      <option value="Poor" className="bg-slate-900">Poor</option>
                      <option value="Arranged By Host" className="bg-slate-900">Arranged By Host</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Accommodation Team
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.accommodationTeam}
                      onChange={(e) => setVForm({ ...vForm, accommodationTeam: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="Arranged" className="bg-slate-900">Arranged</option>
                      <option value="Good" className="bg-slate-900">Good</option>
                      <option value="Poor" className="bg-slate-900">Poor</option>
                      <option value="Arranged By Host" className="bg-slate-900">Arranged By Host</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Volunteer Support
                    </label>
                    <select
                      disabled={vStatus === "COMPLETED" || vStatus === "SUBMITTED" || vStatus === "FORWARDED_TO_STATE" || vStatus === "FORWARDED_TO_ADMIN"}
                      value={vForm.volunteerSupport}
                      onChange={(e) => setVForm({ ...vForm, volunteerSupport: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="Strong" className="bg-slate-900">Strong</option>
                      <option value="Moderate" className="bg-slate-900">Moderate</option>
                      <option value="Needs Help" className="bg-slate-900">Needs Help</option>
                      <option value="Arranged By Host" className="bg-slate-900">Arranged By Host</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar for Verification */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-indigo-200/60 font-medium">
                {vStatus === "COMPLETED" ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Verification Approved. Attendance & Evaluation forms are unlocked.
                  </span>
                ) : vStatus === "PENDING" || vStatus === "REJECTED" ? (
                  "Complete all required fields marked with * and submit."
                ) : (
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Form submitted and currently under review.
                  </span>
                )}
              </span>

              {(vStatus === "PENDING" || vStatus === "REJECTED") && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveForm("VERIFICATION")}
                    disabled={saving || submittingForm !== null}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                  </button>
                  <button
                    onClick={() => handleSubmitForm("VERIFICATION")}
                    disabled={submittingForm !== null || !checkVComplete()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {submittingForm === "VERIFICATION" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Verification Form"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: ATTENDANCE RECORD */}
        {activeStep === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  2. Attendance Form (Post-Meeting)
                </h3>
                <p className="text-xs text-indigo-200/60 mt-0.5">
                  Record actual meeting attendance numbers and field executers.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FormStatusBadge status={aStatus} isLocked={isAttendanceLocked} />
              </div>
            </div>

            {isAttendanceLocked ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">Attendance Form Locked</h4>
                  <p className="text-xs text-indigo-200/70 mt-1 max-w-md mx-auto">
                    This form is locked until the Verification Form completes the approval sequence (Coordinator → Zonal Leader → State Leader → Admin) and receives final Admin approval.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 pt-2">
                  <span className="text-xs text-indigo-200/50">Current Verification Status:</span>
                  <FormStatusBadge status={vStatus} />
                </div>
                <div>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <FileCheck className="h-4 w-4" /> Go to Verification Form
                  </button>
                </div>
              </div>
            ) : (
              <>
                {aStatus === "REJECTED" && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4" />
                      <span>Attendance Form Returned for Corrections</span>
                    </div>
                    {aComments.length > 0 && (
                      <div className="text-xs text-rose-200/90 pl-6 space-y-1">
                        {aComments.map((c, i) => (
                          <p key={i}>"{c.comment}"</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Meeting Date *
                    </label>
                    <input
                      type="date"
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.date}
                      onChange={(e) => setAForm({ ...aForm, date: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Location / Venue *
                    </label>
                    <input
                      type="text"
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.location}
                      onChange={(e) => setAForm({ ...aForm, location: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Meeting hall name and location"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Field Executer *
                    </label>
                    <input
                      type="text"
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.fieldExecuter}
                      onChange={(e) => setAForm({ ...aForm, fieldExecuter: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Name of person executing on field"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Coordinator Name *
                    </label>
                    <input
                      type="text"
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.coordinator}
                      onChange={(e) => setAForm({ ...aForm, coordinator: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Your coordinator name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Members Attended
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.membersAttended}
                      onChange={(e) => setAForm({ ...aForm, membersAttended: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Pastors Attended
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.pastorsAttended}
                      onChange={(e) => setAForm({ ...aForm, pastorsAttended: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Total Headcount
                    </label>
                    <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-emerald-400 text-sm font-black flex items-center h-10.5">
                      {(Number(aForm.membersAttended) || 0) + (Number(aForm.pastorsAttended) || 0)} Total Attendees
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Remarks / Notes *
                    </label>
                    <textarea
                      rows={3}
                      disabled={aStatus === "COMPLETED" || aStatus === "SUBMITTED" || aStatus === "FORWARDED_TO_STATE" || aStatus === "FORWARDED_TO_ADMIN"}
                      value={aForm.remarks}
                      onChange={(e) => setAForm({ ...aForm, remarks: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Special observations or notes about meeting attendance..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-indigo-200/60 font-medium">
                    {aStatus === "COMPLETED" ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Attendance Form Approved & Completed.
                      </span>
                    ) : aStatus === "PENDING" || aStatus === "REJECTED" ? (
                      "Complete attendance details and submit independently or with Evaluation."
                    ) : (
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> Attendance under review.
                      </span>
                    )}
                  </span>

                  {(aStatus === "PENDING" || aStatus === "REJECTED") && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSaveForm("ATTENDANCE")}
                        disabled={saving || submittingForm !== null}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                      </button>
                      <button
                        onClick={() => handleSubmitForm("ATTENDANCE")}
                        disabled={submittingForm !== null || !checkAComplete()}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {submittingForm === "ATTENDANCE" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Submit Attendance Form"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: AFTER-MEETING EVALUATION */}
        {activeStep === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  3. After-Meeting Evaluation Form
                </h3>
                <p className="text-xs text-indigo-200/60 mt-0.5">
                  Record qualitative outcomes, ministry responses, and opportunities for WCM.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FormStatusBadge status={rStatus} isLocked={isEvaluationLocked} />
              </div>
            </div>

            {isEvaluationLocked ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">Evaluation Form Locked</h4>
                  <p className="text-xs text-indigo-200/70 mt-1 max-w-md mx-auto">
                    This form is locked until the Verification Form completes the approval sequence (Coordinator → Zonal Leader → State Leader → Admin) and receives final Admin approval.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 pt-2">
                  <span className="text-xs text-indigo-200/50">Current Verification Status:</span>
                  <FormStatusBadge status={vStatus} />
                </div>
                <div>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <FileCheck className="h-4 w-4" /> Go to Verification Form
                  </button>
                </div>
              </div>
            ) : (
              <>
                {rStatus === "REJECTED" && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4" />
                      <span>After-Meeting Evaluation Returned for Corrections</span>
                    </div>
                    {rComments.length > 0 && (
                      <div className="text-xs text-rose-200/90 pl-6 space-y-1">
                        {rComments.map((c, i) => (
                          <p key={i}>"{c.comment}"</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Overall Meeting Outcome *
                    </label>
                    <select
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.overallMeetingOutcome}
                      onChange={(e) => setRForm({ ...rForm, overallMeetingOutcome: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="" className="bg-slate-900">Select outcome</option>
                      <option value="Exceptional" className="bg-slate-900">Exceptional</option>
                      <option value="Very Good" className="bg-slate-900">Very Good</option>
                      <option value="Good" className="bg-slate-900">Good</option>
                      <option value="Satisfactory" className="bg-slate-900">Satisfactory</option>
                      <option value="Challenging" className="bg-slate-900">Challenging</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Congregation Response *
                    </label>
                    <select
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.congregationResponse}
                      onChange={(e) => setRForm({ ...rForm, congregationResponse: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="" className="bg-slate-900">Select response</option>
                      <option value="Highly Receptive" className="bg-slate-900">Highly Receptive</option>
                      <option value="Positive & Engaged" className="bg-slate-900">Positive & Engaged</option>
                      <option value="Moderate" className="bg-slate-900">Moderate</option>
                      <option value="Reserved" className="bg-slate-900">Reserved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Desire to Continue Fellowship *
                    </label>
                    <select
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.continueFellowship ? "true" : "false"}
                      onChange={(e) => setRForm({ ...rForm, continueFellowship: e.target.value === "true" })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="true" className="bg-slate-900">Yes, Highly Interested</option>
                      <option value="false" className="bg-slate-900">No / Undecided</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Following WCM Members Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.followingWcmMembersCount}
                      onChange={(e) => setRForm({ ...rForm, followingWcmMembersCount: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Local Church Influence
                    </label>
                    <select
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.localChurchInfluence}
                      onChange={(e) => setRForm({ ...rForm, localChurchInfluence: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="High" className="bg-slate-900">High</option>
                      <option value="Medium" className="bg-slate-900">Medium</option>
                      <option value="Low" className="bg-slate-900">Low</option>
                      <option value="Growing" className="bg-slate-900">Growing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Network of Pastors
                    </label>
                    <select
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.networkOfPastors}
                      onChange={(e) => setRForm({ ...rForm, networkOfPastors: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    >
                      <option value="Extensive" className="bg-slate-900">Extensive</option>
                      <option value="Moderate" className="bg-slate-900">Moderate</option>
                      <option value="Limited" className="bg-slate-900">Limited</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Future Opportunities for WCM
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {opportunitiesList.map((op) => {
                        const isSelected = rForm.futureOpportunities?.includes(op);
                        return (
                          <button
                            key={op}
                            type="button"
                            disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                            onClick={() => toggleFutureOpportunity(op)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 text-white border border-indigo-400 shadow-sm"
                                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            } disabled:opacity-50`}
                          >
                            {isSelected ? "✓ " : "+ "}{op}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Strengths Observed *
                    </label>
                    <textarea
                      rows={3}
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.strengthsObserved}
                      onChange={(e) => setRForm({ ...rForm, strengthsObserved: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Strengths observed during the meeting..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Challenges Observed *
                    </label>
                    <textarea
                      rows={3}
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.challengesObserved}
                      onChange={(e) => setRForm({ ...rForm, challengesObserved: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Challenges or areas for improvement..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Opportunity for WCM *
                    </label>
                    <textarea
                      rows={2}
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.opportunityForWcm}
                      onChange={(e) => setRForm({ ...rForm, opportunityForWcm: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="How can WCM follow up or partner with this church..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Coordinator Name *
                    </label>
                    <input
                      type="text"
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.coordinatorName}
                      onChange={(e) => setRForm({ ...rForm, coordinatorName: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Designation *
                    </label>
                    <input
                      type="text"
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.designation}
                      onChange={(e) => setRForm({ ...rForm, designation: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                      placeholder="e.g. Outreach Coordinator"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Signature / Consent *
                    </label>
                    <input
                      type="text"
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.signature}
                      onChange={(e) => setRForm({ ...rForm, signature: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60 font-serif"
                      placeholder="Type name as digital signature"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Submission Date
                    </label>
                    <input
                      type="date"
                      disabled={rStatus === "COMPLETED" || rStatus === "SUBMITTED" || rStatus === "FORWARDED_TO_STATE" || rStatus === "FORWARDED_TO_ADMIN"}
                      value={rForm.submissionDate}
                      onChange={(e) => setRForm({ ...rForm, submissionDate: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-indigo-200/60 font-medium">
                    {rStatus === "COMPLETED" ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Evaluation Form Approved & Completed.
                      </span>
                    ) : rStatus === "PENDING" || rStatus === "REJECTED" ? (
                      "Complete evaluation details and submit independently or with Attendance."
                    ) : (
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> Evaluation under review.
                      </span>
                    )}
                  </span>

                  {(rStatus === "PENDING" || rStatus === "REJECTED") && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSaveForm("EVALUATION")}
                        disabled={saving || submittingForm !== null}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                      </button>
                      <button
                        onClick={() => handleSubmitForm("EVALUATION")}
                        disabled={submittingForm !== null || !checkRComplete()}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {submittingForm === "EVALUATION" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Submit Evaluation Form"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick Session Submitter: If both Attendance & Evaluation are unlocked and pending */}
        {!isAttendanceLocked && !isEvaluationLocked && 
         (aStatus === "PENDING" || aStatus === "REJECTED") && 
         (rStatus === "PENDING" || rStatus === "REJECTED") && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Same-Session Submission
              </p>
              <p className="text-xs text-indigo-200/70 mt-0.5">
                Both Attendance and Evaluation forms are unlocked. You can complete both and submit together.
              </p>
            </div>
            <button
              onClick={handleSubmitBoth}
              disabled={submittingForm !== null || !checkAComplete() || !checkRComplete()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {submittingForm === "BOTH" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit Both Forms Together"
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
