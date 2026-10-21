"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { Save, ArrowLeft, Lock, CheckCircle2, Loader2, FileSpreadsheet, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";

interface AttendanceFormInput {
  date: string;
  location: string;
  fieldExecuter: string;
  coordinator: string;
  membersAttended: number;
  pastorsAttended: number;
  remarks: string;
}

function AttendanceFormContent() {
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
    reset,
    formState: { errors },
  } = useForm<AttendanceFormInput>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      location: "",
      fieldExecuter: "",
      coordinator: "",
      membersAttended: 0,
      pastorsAttended: 0,
      remarks: "",
    },
  });

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
            // Find first completed meeting or first meeting
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

          if (data.attendance) {
            reset({
              date: data.attendance.date
                ? new Date(data.attendance.date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              location: data.attendance.location || "",
              fieldExecuter: data.attendance.fieldExecuter || "",
              coordinator: data.attendance.coordinator || "",
              membersAttended: data.attendance.membersAttended || 0,
              pastorsAttended: data.attendance.pastorsAttended || 0,
              remarks: data.attendance.remarks || "",
            });
          } else {
            reset({
              date: new Date().toISOString().split("T")[0],
              location: data.verification?.stateDistrictCity || "",
              fieldExecuter: "",
              coordinator: data.verification?.convenerName || "",
              membersAttended: 0,
              pastorsAttended: 0,
              remarks: "",
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

  const handleSaveDraft = async (data: AttendanceFormInput) => {
    if (!selectedMeetingId) {
      toast.error("Please select a meeting first");
      return;
    }
    if (isLocked) {
      toast.error("Attendance Form is locked until Verification Form receives final Admin approval.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        meetingId: selectedMeetingId,
        submit: false,
        ...data,
        membersAttended: Number(data.membersAttended),
        pastorsAttended: Number(data.pastorsAttended),
      };

      const res = await fetch("/api/reports/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to save attendance");
      } else {
        toast.success("Attendance Draft Saved Successfully");
        const refreshed = await fetch(`/api/reports/${selectedMeetingId}`);
        if (refreshed.ok) setSelectedMeeting(await refreshed.json());
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAttendance = async (data: AttendanceFormInput) => {
    if (!selectedMeetingId) {
      toast.error("Please select a meeting first");
      return;
    }
    if (isLocked) {
      toast.error("Attendance Form is locked until Verification Form receives final Admin approval.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        meetingId: selectedMeetingId,
        submit: true,
        ...data,
        membersAttended: Number(data.membersAttended),
        pastorsAttended: Number(data.pastorsAttended),
      };

      const res = await fetch("/api/reports/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to submit attendance");
      } else {
        toast.success("Attendance Form Submitted for Review");
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
                <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
                Attendance Form
              </h2>
              <p className="text-xs text-indigo-200/60 font-medium">
                Record attendance statistics linked to an approved meeting.
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
              <h4 className="text-base font-bold text-white uppercase tracking-wider">Attendance Form Locked</h4>
              <p className="text-xs text-indigo-200/70 mt-1 max-w-md mx-auto">
                Meeting <span className="font-mono text-amber-300 font-bold">{selectedMeeting.reportId}</span> Verification Form must complete the approval workflow (Coordinator → Zonal Leader → State Leader → Admin) and receive final Admin approval before Attendance can be submitted.
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
                <FormStatusBadge status={selectedMeeting.attendanceStatus || "PENDING"} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    {...register("date", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Location / Venue *
                  </label>
                  <input
                    type="text"
                    {...register("location", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Meeting hall name and location"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Field Executer *
                  </label>
                  <input
                    type="text"
                    {...register("fieldExecuter", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Field team leader"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Coordinator Name *
                  </label>
                  <input
                    type="text"
                    {...register("coordinator", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Coordinator"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Members Attended
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register("membersAttended")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Pastors Attended
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register("pastorsAttended")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Remarks / Highlights *
                  </label>
                  <textarea
                    rows={3}
                    {...register("remarks", { required: true })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 text-sm font-semibold"
                    placeholder="Key observations from this meeting..."
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
                    onClick={handleSubmit(handleSubmitAttendance)}
                    disabled={saving || submitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Attendance"}
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

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <AttendanceFormContent />
    </Suspense>
  );
}
