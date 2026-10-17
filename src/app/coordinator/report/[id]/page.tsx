"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileCheck, ClipboardList, FileSpreadsheet, Save, Send, ArrowLeft, ArrowRight,
  Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";

export default function MeetingReportWizardPage() {
  const router = useRouter();
  const { id: reportId } = useParams() as { id: string };
  const { language } = useUIStore();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportNumber, setReportNumber] = useState("");
  const [reportStatus, setReportStatus] = useState("");
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

  // Fetch report details on load
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        setReportNumber(data.reportId);
        setReportStatus(data.status);
        setComments(data.reviewerComments || []);

        if (data.verificationSheet) {
          setVForm((prev) => ({ ...prev, ...data.verificationSheet }));
        }
        if (data.attendanceRecord) {
          const dateStr = data.attendanceRecord.date 
            ? new Date(data.attendanceRecord.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          setAForm((prev) => ({ ...prev, ...data.attendanceRecord, date: dateStr }));
        }
        if (data.afterMeetingReport) {
          const subDateStr = data.afterMeetingReport.submissionDate 
            ? new Date(data.afterMeetingReport.submissionDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          setRForm((prev) => ({ ...prev, ...data.afterMeetingReport, submissionDate: subDateStr }));
        }
      } catch (err) {
        toast.error("Failed to load report data");
        router.push("/coordinator/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, router]);

  // Checklist Calculations
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

  const getVPercent = () => {
    let score = 0;
    if (vForm.convenerName.trim()) score++;
    if (vForm.churchMinistryName.trim() && vForm.churchMinistryName !== "Not Specified") score++;
    if (vForm.stateDistrictCity.trim() && vForm.stateDistrictCity !== "Not Specified") score++;
    if (vForm.contactNumber.trim() && vForm.contactNumber !== "Not Specified") score++;
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

  const getOverallPercent = () => {
    return Math.round((getVPercent() + getAPercent() + getRPercent()) / 3);
  };

  const canSubmit = checkVComplete() && checkAComplete() && checkRComplete();

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification: vForm,
          attendance: aForm,
          report: rForm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save draft");
      }

      toast.success("Draft Report Saved Successfully");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!canSubmit) {
      toast.error("Please complete all sections before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Auto save current state first
      const saveRes = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification: vForm,
          attendance: aForm,
          report: rForm,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save final updates before submission.");

      // 2. Submit the report
      const submitRes = await fetch(`/api/reports/${reportId}/submit`, {
        method: "POST",
      });

      if (!submitRes.ok) {
        const data = await submitRes.json();
        throw new Error(data.error || "Failed to submit report");
      }

      toast.success("Meeting Report Submitted Successfully");
      router.push("/coordinator/dashboard");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during submission");
    } finally {
      setSubmitting(false);
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
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Loading meeting report builder...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12 text-left animate-fadeIn">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => router.push("/coordinator/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              onClick={handleSubmitReport}
              disabled={!canSubmit || saving || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Report
            </button>
          </div>
        </div>

        {/* Report Overview Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex flex-wrap items-center gap-2">
              Meeting Report Builder
              <span className="text-xs font-bold text-slate-400 font-mono tracking-normal">({reportNumber})</span>
            </h2>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
              Status: <span className="text-blue-600 dark:text-blue-400 font-black">{reportStatus.replace(/_/g, " ")}</span>
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="flex-1 max-w-md space-y-2 w-full">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Overall Completion</span>
              <span className="text-blue-600 dark:text-blue-450 font-black">{getOverallPercent()}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-505" 
                style={{ width: `${getOverallPercent()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Reviewer Comments Alert */}
        {comments.length > 0 && reportStatus === "REQUEST_CHANGES" && (
          <div className="bg-amber-50 dark:bg-amber-955/10 border border-amber-200/50 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 flex items-start gap-4 animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
              <h4 className="font-black uppercase tracking-wider">Changes Requested by Reviewer</h4>
              <p className="font-semibold whitespace-pre-wrap leading-relaxed italic">
                "{comments[0].comment}"
              </p>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">
                &bull; Requested by {comments[0].reviewer?.name || comments[0].reviewer?.username} ({comments[0].reviewer?.role?.replace(/_/g, " ")}) on {new Date(comments[0].createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Section Steps Navigation Tabs */}
        <div className="grid grid-cols-3 border border-slate-200 dark:border-slate-805 bg-slate-105/50 dark:bg-slate-950 p-1 sm:p-1.5 rounded-2xl gap-1 sm:gap-2">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer min-h-11 ${
              activeStep === 1 
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800" 
                : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
            }`}
          >
            <FileCheck className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${activeStep === 1 ? "text-blue-500" : "text-slate-400"}`} />
            <span className="text-center sm:text-left truncate">
              <span className="hidden sm:inline">1. Verification</span>
              <span className="sm:hidden">1. Verify</span> ({getVPercent()}%)
            </span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer min-h-11 ${
              activeStep === 2 
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800" 
                : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
            }`}
          >
            <ClipboardList className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${activeStep === 2 ? "text-blue-500" : "text-slate-400"}`} />
            <span className="text-center sm:text-left truncate">
              <span className="hidden sm:inline">2. Attendance</span>
              <span className="sm:hidden">2. Attend</span> ({getAPercent()}%)
            </span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer min-h-11 ${
              activeStep === 3 
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800" 
                : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
            }`}
          >
            <FileSpreadsheet className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${activeStep === 3 ? "text-blue-500" : "text-slate-400"}`} />
            <span className="text-center sm:text-left truncate">
              <span className="hidden sm:inline">3. After Meeting</span>
              <span className="sm:hidden">3. Outcome</span> ({getRPercent()}%)
            </span>
          </button>
        </div>

        {/* Wizard Form Panels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
          
          {/* STEP 1: VERIFICATION SHEET */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-black text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                Section 1: Verification Sheet (Before Meeting)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Convener Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vForm.convenerName}
                    onChange={(e) => setVForm({ ...vForm, convenerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., Pastor David"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Church / Ministry Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vForm.churchMinistryName}
                    onChange={(e) => setVForm({ ...vForm, churchMinistryName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., Grace Fellowship"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">State / District / City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vForm.stateDistrictCity}
                    onChange={(e) => setVForm({ ...vForm, stateDistrictCity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., AP, Krishna, Vijayawada"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vForm.contactNumber}
                    onChange={(e) => setVForm({ ...vForm, contactNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., +91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Meeting Dates <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vForm.meetingDates}
                    onChange={(e) => setVForm({ ...vForm, meetingDates: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., July 20-22, 2026"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Days <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={vForm.numberOfDays}
                      onChange={(e) => setVForm({ ...vForm, numberOfDays: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Expected Attendance <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={vForm.expectedAttendance}
                      onChange={(e) => setVForm({ ...vForm, expectedAttendance: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Years of Ministry</label>
                  <input
                    type="number"
                    value={vForm.yearsOfMinistry}
                    onChange={(e) => setVForm({ ...vForm, yearsOfMinistry: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Church Members</label>
                    <input
                      type="number"
                      value={vForm.churchMembers}
                      onChange={(e) => setVForm({ ...vForm, churchMembers: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Workers / Leaders</label>
                    <input
                      type="number"
                      value={vForm.workersLeaders}
                      onChange={(e) => setVForm({ ...vForm, workersLeaders: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Questionnaire & Arrangements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">How did you come to know about WCM?</label>
                  <select
                    value={vForm.knowAboutWcm}
                    onChange={(e) => setVForm({ ...vForm, knowAboutWcm: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm cursor-pointer"
                  >
                    <option value="Other Church Ministers">Other Church Ministers</option>
                    <option value="YouTube / Social Media">YouTube / Social Media</option>
                    <option value="WCM Books / Magazines">WCM Books / Magazines</option>
                    <option value="Word of Mouth">Word of Mouth</option>
                  </select>
                </div>

                <div className="flex flex-col gap-4 justify-center">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vForm.readWcmBooks}
                      onChange={(e) => setVForm({ ...vForm, readWcmBooks: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 dark:bg-slate-950 dark:border-slate-800 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Have you read WCM books?</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vForm.attendedProphetMeeting}
                      onChange={(e) => setVForm({ ...vForm, attendedProphetMeeting: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-355 text-blue-600 focus:ring-blue-500/20 dark:bg-slate-950 dark:border-slate-800 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Have you attended Prophet Kiran Paul Garu's meeting?</span>
                  </label>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-white mb-4">Arrangements Check</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Meeting Hall / Stage</label>
                      <input
                        type="text"
                        value={vForm.meetingHallStage}
                        onChange={(e) => setVForm({ ...vForm, meetingHallStage: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Sound System</label>
                      <input
                        type="text"
                        value={vForm.soundSystem}
                        onChange={(e) => setVForm({ ...vForm, soundSystem: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Accommodation for Team</label>
                      <input
                        type="text"
                        value={vForm.accommodationTeam}
                        onChange={(e) => setVForm({ ...vForm, accommodationTeam: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Volunteer Support</label>
                      <input
                        type="text"
                        value={vForm.volunteerSupport}
                        onChange={(e) => setVForm({ ...vForm, volunteerSupport: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Wizard Steps Controller */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-500/10 active:scale-[0.96]"
                >
                  Next: Attendance Record
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ATTENDANCE RECORD */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-black text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                Section 2: Attendance Record (During Meeting)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Meeting Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={aForm.date}
                    onChange={(e) => setAForm({ ...aForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Meeting Location <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={aForm.location}
                    onChange={(e) => setAForm({ ...aForm, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., Hall 3, Vijayawada"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Field Executer <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={aForm.fieldExecuter}
                    onChange={(e) => setAForm({ ...aForm, fieldExecuter: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., Bro. Timothy"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Coordinator Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={aForm.coordinator}
                    onChange={(e) => setAForm({ ...aForm, coordinator: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., John"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Members Attended <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={aForm.membersAttended}
                      onChange={(e) => setAForm({ ...aForm, membersAttended: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Pastors Attended <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={aForm.pastorsAttended}
                      onChange={(e) => setAForm({ ...aForm, pastorsAttended: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Remarks / Observations <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={aForm.remarks}
                    onChange={(e) => setAForm({ ...aForm, remarks: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm resize-none"
                    placeholder="Enter main attendance summary and highlights..."
                  />
                </div>
              </div>

              {/* Wizard Steps Controller */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
                <button
                  onClick={() => setActiveStep(1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-[0.96]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back: Verification
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-955 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-105 transition-colors cursor-pointer border border-blue-500/10 active:scale-[0.96]"
                >
                  Next: After Meeting Sheet
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AFTER MEETING SHEET */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-sm font-black text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                Section 3: After Meeting Sheet (After Meeting)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Overall Meeting Outcome <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={rForm.overallMeetingOutcome}
                    onChange={(e) => setRForm({ ...rForm, overallMeetingOutcome: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm resize-none"
                    placeholder="E.g., Great response from pastors, many bought books..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Congregation Response <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={rForm.congregationResponse}
                    onChange={(e) => setRForm({ ...rForm, congregationResponse: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm resize-none"
                    placeholder="Describe how the congregation responded during prayers..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Strengths Observed <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={rForm.strengthsObserved}
                    onChange={(e) => setRForm({ ...rForm, strengthsObserved: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm resize-none"
                    placeholder="List strong points..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Challenges Observed <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={rForm.challengesObserved}
                    onChange={(e) => setRForm({ ...rForm, challengesObserved: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm resize-none"
                    placeholder="List challenges..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Opportunity for WCM <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={rForm.opportunityForWcm}
                    onChange={(e) => setRForm({ ...rForm, opportunityForWcm: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm resize-none"
                    placeholder="Describe how WCM can support further outreach..."
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Local Church Influence</label>
                    <input
                      type="text"
                      value={rForm.localChurchInfluence}
                      onChange={(e) => setRForm({ ...rForm, localChurchInfluence: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                      placeholder="Low / Medium / High"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Network of Pastors Established</label>
                    <input
                      type="text"
                      value={rForm.networkOfPastors}
                      onChange={(e) => setRForm({ ...rForm, networkOfPastors: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Future Opportunities (Check all that apply)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {opportunitiesList.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => toggleFutureOpportunity(op)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          rForm.futureOpportunities.includes(op)
                            ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850"
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Following WCM Members Count</label>
                    <input
                      type="number"
                      min={0}
                      value={rForm.followingWcmMembersCount}
                      onChange={(e) => setRForm({ ...rForm, followingWcmMembersCount: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rForm.continueFellowship}
                        onChange={(e) => setRForm({ ...rForm, continueFellowship: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 dark:bg-slate-955 dark:border-slate-800 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Continue Fellowship?</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Coordinator Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={rForm.coordinatorName}
                    onChange={(e) => setRForm({ ...rForm, coordinatorName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Designation <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={rForm.designation}
                    onChange={(e) => setRForm({ ...rForm, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                    placeholder="E.g., Coordinator"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Signature / Consent <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={rForm.signature}
                    onChange={(e) => setRForm({ ...rForm, signature: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm font-serif"
                    placeholder="Type name as signature..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Submission Date</label>
                  <input
                    type="date"
                    value={rForm.submissionDate}
                    onChange={(e) => setRForm({ ...rForm, submissionDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Wizard Steps Controller */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-[0.96]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back: Attendance
                </button>

                {!canSubmit && (
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-405 flex items-center gap-1.5 max-w-xs text-left sm:text-right animate-pulse">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    Please complete all required fields marked with * in all steps to enable submission.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
