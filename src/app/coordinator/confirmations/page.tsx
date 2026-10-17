"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CalendarCheck, Plus, X, Send, ClipboardCheck } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";

export default function CoordinatorConfirmationsPage() {
  const { language } = useUIStore();
  const [confirmationsList, setConfirmationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [meetingDates, setMeetingDates] = useState("");
  const [location, setLocation] = useState("");
  const [expectedAttendance, setExpectedAttendance] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchConfirmations = async () => {
    try {
      const res = await fetch("/api/confirmations");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfirmationsList(data);
    } catch (err) {
      toast.error("Failed to load meeting confirmations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingDates.trim() || !location.trim() || !expectedAttendance || !message.trim()) {
      toast.error("All fields are required");
      return;
    }

    const attendanceNum = parseInt(expectedAttendance, 10);
    if (isNaN(attendanceNum) || attendanceNum <= 0) {
      toast.error("Expected attendance must be a valid positive number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDates,
          location,
          expectedAttendance: attendanceNum,
          message,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to submit request");
      } else {
        toast.success("Meeting proposal submitted successfully!");
        setShowModal(false);
        // Clear form
        setMeetingDates("");
        setLocation("");
        setExpectedAttendance("");
        setMessage("");
        // Reload list
        fetchConfirmations();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {translate("Meeting Confirmations", language)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">
              Submit upcoming meeting details to administration for review and track confirmation outcomes.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer self-start sm:self-auto w-fit"
          >
            <Plus className="h-4 w-4" />
            Request Confirmation
          </button>
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden text-left">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-widest">
              <ClipboardCheck className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              Your Proposal History
            </h3>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Loading proposals...</span>
            </div>
          ) : confirmationsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-505 font-bold uppercase tracking-wider italic">
              No meeting confirmation requests found. Submit a proposal to start.
            </div>
          ) : (
            <>
              {/* Mobile Cards (Phone View: < md) */}
              <div className="md:hidden space-y-3 p-3">
                {confirmationsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {c.location}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                          Dates: {c.meetingDates}
                        </span>
                      </div>
                      <div>
                        {c.status === "PENDING" && (
                          <span className="inline-flex rounded-full bg-amber-50 dark:bg-amber-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-250/30 dark:border-amber-900/30">
                            Pending
                          </span>
                        )}
                        {c.status === "APPROVED" && (
                          <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-805 dark:text-emerald-400 border border-emerald-250/30 dark:border-emerald-900/30">
                            Approved
                          </span>
                        )}
                        {c.status === "REJECTED" && (
                          <span className="inline-flex rounded-full bg-red-50 dark:bg-red-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-750 dark:text-red-400 border border-red-250/30 dark:border-red-900/30">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Proposal Note:
                      </span>
                      <p className="leading-relaxed font-medium">{c.message}</p>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400">
                        <span>Expected Attendance:</span>
                        <strong className="text-slate-700 dark:text-slate-200">{c.expectedAttendance}</strong>
                      </div>
                    </div>

                    {c.adminFeedback && (
                      <div className="text-xs bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                          Admin Remarks:
                        </span>
                        <p className="italic text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          "{c.adminFeedback}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase tracking-widest text-[10px]">
                      <th className="px-6 py-4">{translate("Meeting Details", language)}</th>
                      <th className="px-6 py-4">{translate("Proposal Description", language)}</th>
                      <th className="px-6 py-4">{translate("Status", language)}</th>
                      <th className="px-6 py-4">{translate("Remarks", language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-805/60 text-slate-700 dark:text-slate-300">
                    {confirmationsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold block text-slate-805 dark:text-white text-xs">{c.location}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold mt-0.5">Dates: {c.meetingDates}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Exp. Attendance: {c.expectedAttendance}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs whitespace-pre-wrap text-slate-600 dark:text-slate-350 leading-relaxed text-xs font-semibold">
                          {c.message}
                        </td>
                        <td className="px-6 py-4">
                          {c.status === "PENDING" && (
                            <span className="inline-flex rounded-full bg-amber-50 dark:bg-amber-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-250/30 dark:border-amber-900/30">
                              Pending
                            </span>
                          )}
                          {c.status === "APPROVED" && (
                            <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-805 dark:text-emerald-400 border border-emerald-250/30 dark:border-emerald-900/30">
                              Approved
                            </span>
                          )}
                          {c.status === "REJECTED" && (
                            <span className="inline-flex rounded-full bg-red-50 dark:bg-red-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-750 dark:text-red-400 border border-red-250/30 dark:border-red-900/30">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          {c.adminFeedback ? (
                            <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-805 font-medium italic leading-relaxed">
                              "{c.adminFeedback}"
                            </p>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">No comments yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: New Request Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto animate-modal my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-805 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {translate("Upcoming Meeting Proposal", language)}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-655 dark:hover:text-slate-205 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                  {translate("Location", language)} *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                  placeholder="e.g. Grace Tabernacle, Hyderabad"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                  {translate("Meeting Dates", language)} *
                </label>
                <input
                  type="text"
                  required
                  value={meetingDates}
                  onChange={(e) => setMeetingDates(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                  placeholder="e.g. Aug 12th - Aug 15th, 2026"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                  {translate("Expected Attendance", language)} *
                </label>
                <input
                  type="number"
                  required
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                  placeholder="e.g. 150"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                  {translate("Proposal Description", language)} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-905 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                  placeholder="Describe your meeting objectives, ministry arrangement plans, convener details, etc."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-250 dark:border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {translate("Cancel", language)}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : translate("Submit Proposal", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
