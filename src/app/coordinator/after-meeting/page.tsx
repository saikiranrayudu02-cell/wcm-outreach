"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ArrowLeft, Save, Lock, CheckCircle2, Loader2, ClipboardList, PlusCircle } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";

interface AfterMeetingFormInput {
  overallMeetingOutcome: string;
  congregationResponse: string;
  continueFellowship: string;
  futureOpportunities: string[];
  localChurchInfluence: string;
  networkOfPastors: string;
  followingWcmMembersCount: number;
  strengthsObserved: string;
  challengesObserved: string;
  opportunityForWcm: string;
  coordinatorName: string;
  designation: string;
  signature: string;
  submissionDate: string;
}

function AfterMeetingFormContent() {
  const { language } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMeetingId = searchParams.get("meetingId") || "";

  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(initialMeetingId);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AfterMeetingFormInput>({
    defaultValues: {
      overallMeetingOutcome: "Good",
      congregationResponse: "Positive & Engaged",
      continueFellowship: "true",
      futureOpportunities: [],
      localChurchInfluence: "Medium",
      networkOfPastors: "Medium",
      followingWcmMembersCount: 0,
      submissionDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedOps = watch("futureOpportunities") || [];

  // Fetch coordinator meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const data = await res.json();
          setMeetings(data);
          
          if (initialMeetingId) {
            const found = data.find((m: any) => m.id === initialMeetingId || m.reportId === initialMeetingId);
            if (found) {
              setSelectedMeetingId(found.id);
            }
          } else if (data.length > 0) {
            const completedMtg = data.find((m: any) => m.verificationStatus === "COMPLETED");
            if (completedMtg) {
              setSelectedMeetingId(completedMtg.id);
            } else {
              setSelectedMeetingId(data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load meetings", err);
      } finally {
        setLoadingMeetings(false);
      }
    };

    fetchMeetings();
  }, [initialMeetingId]);

  // Load meeting details when selectedMeetingId changes
  useEffect(() => {
    if (!selectedMeetingId) {
      setSelectedMeeting(null);
      return;
    }

    const loadMeeting = async () => {
      try {
        const res = await fetch(`/api/reports/${selectedMeetingId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedMeeting(data);

          if (data.report) {
            reset({
              overallMeetingOutcome: data.report.overallMeetingOutcome || "Good",
              congregationResponse: data.report.congregationResponse || "Positive & Engaged",
              continueFellowship: String(data.report.continueFellowship ?? true),
              futureOpportunities: data.report.futureOpportunities || [],
              localChurchInfluence: data.report.localChurchInfluence || "Medium",
              networkOfPastors: data.report.networkOfPastors || "Medium",
              followingWcmMembersCount: data.report.followingWcmMembersCount || 0,
              strengthsObserved: data.report.strengthsObserved || "",
              challengesObserved: data.report.challengesObserved || "",
              opportunityForWcm: data.report.opportunityForWcm || "",
              coordinatorName: data.report.coordinatorName || data.leader?.username || "",
              designation: data.report.designation || "Coordinator",
              signature: data.report.signature || "",
              submissionDate: data.report.submissionDate
                ? new Date(data.report.submissionDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            });
          } else {
            reset({
              overallMeetingOutcome: "Good",
              congregationResponse: "Positive & Engaged",
              continueFellowship: "true",
              futureOpportunities: [],
              localChurchInfluence: "Medium",
              networkOfPastors: "Medium",
              followingWcmMembersCount: 0,
              strengthsObserved: "",
              challengesObserved: "",
              opportunityForWcm: "",
              coordinatorName: data.verification?.convenerName || data.leader?.username || "",
              designation: "Coordinator",
              signature: "",
              submissionDate: new Date().toISOString().split("T")[0],
            });
          }
        }
      } catch (err) {
        toast.error("Failed to load meeting details");
      }
    };

    loadMeeting();
  }, [selectedMeetingId, reset]);

  const isLocked = selectedMeeting ? selectedMeeting.verificationStatus !== "COMPLETED" : true;

  const handleSaveDraft = async (data: AfterMeetingFormInput) => {
    if (!selectedMeetingId) {
      toast.error("Please select a meeting first");
      return;
    }
    if (isLocked) {
      toast.error("Evaluation Form is locked until Verification Form receives final Admin approval.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        meetingId: selectedMeetingId,
        submit: false,
        ...data,
        continueFellowship: data.continueFellowship === "true",
        followingWcmMembersCount: Number(data.followingWcmMembersCount),
      };

      const res = await fetch("/api/reports/after-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to save evaluation");
      } else {
        toast.success("Evaluation Draft Saved Successfully");
        const refreshed = await fetch(`/api/reports/${selectedMeetingId}`);
        if (refreshed.ok) setSelectedMeeting(await refreshed.json());
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEvaluation = async (data: AfterMeetingFormInput) => {
    if (!selectedMeetingId) {
      toast.error("Please select a meeting first");
      return;
    }
    if (isLocked) {
      toast.error("Evaluation Form is locked until Verification Form receives final Admin approval.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        meetingId: selectedMeetingId,
        submit: true,
        ...data,
        continueFellowship: data.continueFellowship === "true",
        followingWcmMembersCount: Number(data.followingWcmMembersCount),
      };

      const res = await fetch("/api/reports/after-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to submit evaluation");
      } else {
        toast.success("After-Meeting Evaluation Submitted for Review");
        router.push(`/coordinator/report/${selectedMeetingId}`);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeetings) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Loading meetings...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto pb-12 text-left animate-fadeIn">
        {/* Header section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/coordinator/dashboard")}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-400" />
                After-Meeting Evaluation Form
              </h2>
              <p className="text-xs text-indigo-200/60 font-medium">
                Record ministry outcomes linked to an approved meeting.
              </p>
            </div>
          </div>
        </div>

        {/* Meeting Selector Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Select Linked Meeting ID *
          </label>
          {meetings.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center space-y-2">
              <p className="text-xs text-indigo-200/70">No meetings found. Create a meeting and complete verification first.</p>
              <button
                onClick={() => router.push("/coordinator/verification")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                <PlusCircle className="h-4 w-4" /> Go to Verification Form
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-xs font-bold"
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.reportId} — {m.title || "Meeting"} ({m.verificationStatus})
                  </option>
                ))}
              </select>

              {selectedMeeting && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Verification Status:</span>
                  <FormStatusBadge status={selectedMeeting.verificationStatus} size="sm" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Locked Warning or Form */}
        {selectedMeeting && isLocked ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white uppercase tracking-wider">Evaluation Form Locked</h4>
              <p className="text-xs text-indigo-200/70 mt-1 max-w-md mx-auto">
                Meeting <span className="font-mono text-amber-300 font-bold">{selectedMeeting.reportId}</span> Verification Form must complete the approval sequence (Coordinator → Zonal Leader → State Leader → Admin) and receive final Admin approval before Evaluation can be submitted.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 pt-2">
              <span className="text-xs text-indigo-200/50">Current Verification Status:</span>
              <FormStatusBadge status={selectedMeeting.verificationStatus} />
            </div>
            <div>
              <button
                onClick={() => router.push(`/coordinator/report/${selectedMeeting.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                View Meeting Lifecycle Details
              </button>
            </div>
          </div>
        ) : selectedMeeting ? (
          <form className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Linked to Meeting: {selectedMeeting.reportId}
                </span>
                <FormStatusBadge status={selectedMeeting.evaluationStatus || "PENDING"} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Overall Meeting Outcome *
                  </label>
                  <select
                    {...register("overallMeetingOutcome", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  >
                    <option value="Exceptional">Exceptional</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Challenging">Challenging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Congregation Response *
                  </label>
                  <select
                    {...register("congregationResponse", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  >
                    <option value="Highly Receptive">Highly Receptive</option>
                    <option value="Positive & Engaged">Positive & Engaged</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Strengths Observed *
                  </label>
                  <textarea
                    rows={3}
                    {...register("strengthsObserved", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Observed strengths..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Challenges Observed *
                  </label>
                  <textarea
                    rows={3}
                    {...register("challengesObserved", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Observed challenges..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Opportunity for WCM *
                  </label>
                  <textarea
                    rows={2}
                    {...register("opportunityForWcm", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Future outreach opportunities with this church..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Coordinator Name *
                  </label>
                  <input
                    type="text"
                    {...register("coordinatorName", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Designation *
                  </label>
                  <input
                    type="text"
                    {...register("designation", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Signature / Consent *
                  </label>
                  <input
                    type="text"
                    {...register("signature", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold font-serif"
                    placeholder="Type name as digital signature"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Submission Date
                  </label>
                  <input
                    type="date"
                    {...register("submissionDate")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push(`/coordinator/report/${selectedMeeting.id}`)}
                  className="text-xs text-indigo-300 hover:text-white font-bold uppercase tracking-wider transition-colors"
                >
                  View All 3 Forms
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit(handleSaveDraft)}
                    disabled={saving || submitting}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(handleSubmitEvaluation)}
                    disabled={saving || submitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Evaluation"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default function AfterMeetingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <AfterMeetingFormContent />
    </Suspense>
  );
}
