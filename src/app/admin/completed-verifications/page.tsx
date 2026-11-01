"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { 
  ShieldCheck, PhoneCall, Search, RefreshCw, Eye, 
  MapPin, Calendar, Users, Phone, Building, CheckCircle2, 
  Clock, AlertCircle, X, ArrowUpRight, Sparkles, Filter, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { CallAudioPlayer } from "@/components/call-audio-player";

export default function CompletedVerificationsPage() {
  const router = useRouter();
  const { user, language } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [callStatusFilter, setCallStatusFilter] = useState("ALL");

  // Record detail modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Call dispatch modal
  const [callModalRecord, setCallModalRecord] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const fetchCompletedVerifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (callStatusFilter !== "ALL") params.set("callStatus", callStatusFilter);

      const res = await fetch(`/api/admin/verifications/completed?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Unauthorized: Admin access required.");
          router.push("/login");
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setVerifications(data.verifications || []);
    } catch (err) {
      toast.error("Failed to load completed verifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedVerifications();
  }, [callStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompletedVerifications();
  };

  const handleInitiateCall = async () => {
    if (!callModalRecord) return;
    setDispatching(true);
    try {
      const res = await fetch("/api/calls/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationSheetId: callModalRecord.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to dispatch AI call.");
      } else {
        toast.success("AI voice call successfully dispatched!");
        setCallModalRecord(null);
        fetchCompletedVerifications();
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred while initiating the call.");
    } finally {
      setDispatching(false);
    }
  };

  // Metrics
  const totalCompleted = verifications.length;
  const callsCompleted = verifications.filter((v) => v.latestCallAttempt?.status === "COMPLETED").length;
  const callsInProgress = verifications.filter((v) => v.isCurrentlyCalling).length;
  const notCalledYet = verifications.filter((v) => !v.latestCallAttempt).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Completed Verifications
                </h1>
                <p className="text-xs text-foreground/50 font-medium">
                  Verified and approved outreach meeting records eligible for automated voice confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchCompletedVerifications()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/80 text-foreground/70 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => router.push("/admin/calling-center")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md hover:opacity-95"
              style={{ background: "var(--gradient-accent)" }}
            >
              <PhoneCall className="h-4 w-4" />
              AI Calling Center
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Approved</span>
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">{totalCompleted}</p>
            <span className="text-[10px] text-foreground/40 font-semibold mt-1">Eligible meeting verifications</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Calls Completed</span>
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-500 dark:text-emerald-400">{callsCompleted}</p>
            <span className="text-[10px] text-foreground/40 font-semibold mt-1">Voice confirmation delivered</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
              <Clock className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-500 dark:text-blue-400">{callsInProgress}</p>
            <span className="text-[10px] text-foreground/40 font-semibold mt-1">Currently dialing or in call</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Needs Calling</span>
              <PhoneCall className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">{notCalledYet}</p>
            <span className="text-[10px] text-foreground/40 font-semibold mt-1">Ready for initial outreach</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-border/50 glass-card">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by convener name, church, city, phone number, or report ID..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border/50 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </form>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Call Status:
            </span>
            <select
              value={callStatusFilter}
              onChange={(e) => setCallStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-border/50 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="ALL">All Records</option>
              <option value="NOT_CALLED">Not Called Yet</option>
              <option value="COMPLETED">Call Completed</option>
              <option value="DISPATCHED">In Progress / Dispatched</option>
              <option value="FAILED_OR_BUSY">Failed / Busy / No Answer</option>
            </select>
          </div>
        </div>

        {/* Records Table and Mobile Cards */}
        <div className="rounded-2xl border border-border/50 glass-card overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-foreground/40 font-medium">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <span className="text-xs uppercase tracking-wider font-bold">Loading Completed Verifications...</span>
              </div>
            </div>
          ) : verifications.length === 0 ? (
            <div className="py-16 text-center text-foreground/40 font-medium italic">
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-foreground/20" />
                <span>No completed verifications match your criteria.</span>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< 768px) */}
              <div className="md:hidden divide-y divide-border/30">
                {verifications.map((record) => {
                  const latest = record.latestCallAttempt;
                  return (
                    <div key={record.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          {record.reportId}
                        </span>
                        {!latest ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-foreground/5 text-foreground/50 border border-border/40">
                            Not Called
                          </span>
                        ) : latest.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed {latest.durationFormatted ? `(${latest.durationFormatted})` : ""}
                          </span>
                        ) : latest.status === "DISPATCHED" || latest.status === "IN_PROGRESS" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            Dialing / Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            {latest.status} (#{latest.attemptNumber})
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {record.convenerName}
                        </h4>
                        <p className="text-xs text-foreground/70 font-medium">
                          {record.churchMinistryName || "Ministry Partner"}
                        </p>
                        <p className="text-[11px] text-foreground/50 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {record.stateDistrictCity}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-foreground/70">
                            {record.formattedPhone}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold text-[10px]">
                            <Users className="h-3 w-3" />
                            {record.expectedAttendance.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-2 rounded-xl border border-border/60 bg-card hover:bg-accent text-foreground/70 cursor-pointer min-h-9.5 min-w-9.5 flex items-center justify-center"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCallModalRecord(record)}
                            disabled={record.isCurrentlyCalling || !record.isPhoneValid}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer min-h-9.5 ${
                              record.isCurrentlyCalling
                                ? "bg-foreground/10 text-foreground/40 cursor-not-allowed"
                                : "text-white shadow-xs hover:opacity-95"
                            }`}
                            style={{
                              background: record.isCurrentlyCalling ? undefined : "var(--gradient-accent)",
                            }}
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            {latest?.status === "COMPLETED" ? "Re-Call" : latest ? "Retry" : "Call"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop / Tablet Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-accent/30 text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">
                      <th className="py-3.5 px-4">Report / Church</th>
                      <th className="py-3.5 px-4">Convener & Phone</th>
                      <th className="py-3.5 px-4">Location & Dates</th>
                      <th className="py-3.5 px-4 text-center">Expected Headcount</th>
                      <th className="py-3.5 px-4">Approved At</th>
                      <th className="py-3.5 px-4 text-center">Call Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-xs">
                    {verifications.map((record) => {
                      const latest = record.latestCallAttempt;
                      return (
                        <tr key={record.id} className="hover:bg-accent/40 transition-colors">
                          {/* Report & Church */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                  {record.reportId}
                                </span>
                                <span className="font-bold text-foreground text-xs truncate max-w-45">
                                  {record.churchMinistryName || "Ministry Partner"}
                                </span>
                              </div>
                              <span className="text-[11px] text-foreground/50 flex items-center gap-1">
                                <Building className="h-3 w-3 shrink-0" />
                                {record.reportTitle || "Outreach Meeting"}
                              </span>
                            </div>
                          </td>

                          {/* Convener & Phone */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-foreground">{record.convenerName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-foreground/70">
                                  {record.formattedPhone}
                                </span>
                                {!record.isPhoneValid && (
                                  <span className="text-[9px] bg-red-500/10 text-red-500 font-bold px-1 rounded" title={record.phoneError}>
                                    Invalid Format
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Location & Dates */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-foreground/80 flex items-center gap-1 text-[11px] font-medium">
                                <MapPin className="h-3 w-3 text-foreground/40 shrink-0" />
                                {record.stateDistrictCity}
                              </span>
                              <span className="text-foreground/50 text-[10px] flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {record.meetingDates} ({record.numberOfDays}d)
                              </span>
                            </div>
                          </td>

                          {/* Expected Headcount */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold text-xs">
                              <Users className="h-3 w-3" />
                              {record.expectedAttendance.toLocaleString()}
                            </span>
                          </td>

                          {/* Approved Date */}
                          <td className="py-3.5 px-4 text-foreground/60 text-[11px] whitespace-nowrap">
                            {record.approvedAt ? new Date(record.approvedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }) : "Approved"}
                          </td>

                          {/* Call Status */}
                          <td className="py-3.5 px-4 text-center">
                            {!latest ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-foreground/5 text-foreground/50 border border-border/40">
                                Not Called
                              </span>
                            ) : latest.status === "COMPLETED" ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completed {latest.durationFormatted ? `(${latest.durationFormatted})` : ""}
                                </span>
                                {latest.recordingUrl && (
                                  <CallAudioPlayer
                                    compact
                                    src={latest.recordingUrl}
                                    callId={latest.id}
                                    contactName={record.convenerName}
                                    duration={latest.duration}
                                    durationFormatted={latest.durationFormatted}
                                  />
                                )}
                              </div>
                            ) : latest.status === "DISPATCHED" || latest.status === "IN_PROGRESS" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                                Dialing / Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <AlertCircle className="h-3 w-3" />
                                {latest.status} (Attempt #{latest.attemptNumber})
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedRecord(record)}
                                className="p-1.5 rounded-xl border border-border/50 bg-card hover:bg-accent text-foreground/60 hover:text-foreground cursor-pointer transition-colors"
                                title="View Full Verification Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => setCallModalRecord(record)}
                                disabled={record.isCurrentlyCalling || !record.isPhoneValid}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                                  record.isCurrentlyCalling
                                    ? "bg-foreground/10 text-foreground/40 cursor-not-allowed"
                                    : "text-white shadow-xs hover:opacity-95"
                                }`}
                                style={{
                                  background: record.isCurrentlyCalling ? undefined : "var(--gradient-accent)",
                                }}
                              >
                                <PhoneCall className="h-3 w-3" />
                                {latest?.status === "COMPLETED" ? "Re-Call" : latest ? "Retry Call" : "Call"}
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

        {/* Modal 1: Full Verification Details */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-2xl rounded-3xl bg-card border border-border/50 p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-left">
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {selectedRecord.reportId}
                    </span>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                      ✓ Approved & Completed
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-foreground mt-1">
                    {selectedRecord.churchMinistryName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 rounded-xl text-foreground/40 hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Convener Name</span>
                  <span className="font-bold text-foreground text-sm">{selectedRecord.convenerName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Contact Phone</span>
                  <span className="font-mono font-bold text-foreground text-sm">{selectedRecord.formattedPhone}</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Location / State / City</span>
                  <span className="font-semibold text-foreground">{selectedRecord.stateDistrictCity}</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Meeting Dates</span>
                  <span className="font-semibold text-foreground">{selectedRecord.meetingDates} ({selectedRecord.numberOfDays} Days)</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Expected Attendance</span>
                  <span className="font-bold text-indigo-500 text-sm">{selectedRecord.expectedAttendance} attendees</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Years of Ministry & Church Members</span>
                  <span className="font-semibold text-foreground">{selectedRecord.yearsOfMinistry} yrs · {selectedRecord.churchMembers} members ({selectedRecord.workersLeaders} leaders)</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Stage & Sound System</span>
                  <span className="font-medium text-foreground">{selectedRecord.meetingHallStage} · {selectedRecord.soundSystem}</span>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider block mb-1">Accommodation & Volunteers</span>
                  <span className="font-medium text-foreground">{selectedRecord.accommodationTeam} · {selectedRecord.volunteerSupport}</span>
                </div>
              </div>

              {/* Call History preview */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-primary" />
                  Call History ({selectedRecord.totalAttempts} attempts)
                </h4>
                {selectedRecord.totalAttempts === 0 ? (
                  <p className="text-xs text-foreground/40 italic">No automated calls have been dispatched to this contact yet.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-accent/20 border border-border/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground">Latest Attempt #{selectedRecord.latestCallAttempt?.attemptNumber}</span>
                        <span className="text-[11px] text-foreground/50 block">Status: {selectedRecord.latestCallAttempt?.status}</span>
                      </div>
                      {selectedRecord.latestCallAttempt?.durationFormatted && (
                        <span className="font-mono text-xs font-bold text-foreground/70">
                          Duration: {selectedRecord.latestCallAttempt?.durationFormatted}
                        </span>
                      )}
                    </div>
                    {selectedRecord.latestCallAttempt?.recordingUrl && (
                      <div className="mt-3">
                        <CallAudioPlayer
                          src={selectedRecord.latestCallAttempt.recordingUrl}
                          callId={selectedRecord.latestCallAttempt.id}
                          contactName={selectedRecord.convenerName}
                          duration={selectedRecord.latestCallAttempt.duration}
                          durationFormatted={selectedRecord.latestCallAttempt.durationFormatted}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl border border-border/50 text-xs font-bold text-foreground/60 hover:bg-accent cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const rec = selectedRecord;
                    setSelectedRecord(null);
                    setCallModalRecord(rec);
                  }}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 cursor-pointer flex items-center gap-2"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Dispatch AI Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Dispatch AI Call Confirmation */}
        {callModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-md rounded-3xl bg-card border border-border/50 p-6 shadow-2xl text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                  <PhoneCall className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Confirm AI Voice Call
                  </h3>
                  <p className="text-xs text-foreground/50 font-medium">
                    OmniDimension Voice Outreach Agent
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-accent/30 border border-border/40 text-xs mb-5">
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-foreground/50 font-medium">Recipient:</span>
                  <span className="font-bold text-foreground">{callModalRecord.convenerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-foreground/50 font-medium">Destination Phone:</span>
                  <span className="font-mono font-bold text-foreground">{callModalRecord.formattedPhone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-foreground/50 font-medium">Church / Ministry:</span>
                  <span className="font-semibold text-foreground truncate max-w-50">{callModalRecord.churchMinistryName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/20">
                  <span className="text-foreground/50 font-medium">Agent:</span>
                  <span className="font-semibold text-indigo-400">WCM Prayer Meeting Confirmation Telugu</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-foreground/50 font-medium">Languages:</span>
                  <span className="font-semibold text-foreground/80">English, Hindi, Telugu</span>
                </div>
              </div>

              <p className="text-[11px] text-foreground/45 italic mb-5 leading-relaxed">
                The AI voice agent will initiate a live phone call to confirm meeting logistics, stage readiness, sound equipment, and dates with the convener.
              </p>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setCallModalRecord(null)}
                  disabled={dispatching}
                  className="px-4 py-2.5 rounded-xl border border-border/50 text-xs font-bold text-foreground/60 hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiateCall}
                  disabled={dispatching}
                  className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  {dispatching ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="h-3.5 w-3.5" />
                      Start Call Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
