"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { 
  PhoneCall, PhoneForwarded, RefreshCw, Play, Pause, 
  Volume2, MessageSquare, CheckCircle2, Clock, AlertCircle, 
  X, Search, Filter, History, RotateCcw, Sparkles, Building, 
  Phone, Users, User, Calendar, ExternalLink, PhoneMissed, PhoneOff, Lock
} from "lucide-react";
import { toast } from "sonner";
import { GeographicFilterBar, GeographicFilterState } from "@/components/geographic-filter-bar";
import { CallAudioPlayer } from "@/components/call-audio-player";

export default function CallingCenterPage() {
  const router = useRouter();
  const { user } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any | null>(null);

  // Call Initiation Modal
  const [callModalRecord, setCallModalRecord] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // Retry action state
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [geoFilters, setGeoFilters] = useState<GeographicFilterState>({});

  const loadData = async (filters: GeographicFilterState = geoFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.state) params.set("state", filters.state);
      if (filters.zone) params.set("zone", filters.zone);
      if (filters.district) params.set("district", filters.district);
      if (filters.part) params.set("part", filters.part);

      const [verifRes, histRes] = await Promise.all([
        fetch(`/api/admin/verifications/completed?${params.toString()}`),
        fetch("/api/calls/history?limit=100"),
      ]);

      if (verifRes.status === 403 || histRes.status === 403) {
        toast.error("Unauthorized: Admin credentials required.");
        router.push("/login");
        return;
      }

      const verifData = await verifRes.json();
      const histData = await histRes.json();

      setVerifications(verifData.verifications || []);
      setCallHistory(histData.attempts || []);
    } catch (err) {
      toast.error("Failed to load Calling Center records.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeoFilterChange = (newFilters: GeographicFilterState) => {
    setGeoFilters(newFilters);
    loadData(newFilters);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh poll every 20s for active calls
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncWithProvider = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calls/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to sync call logs with OmniDimension.");
      } else {
        toast.success(data.message || "Synced call statuses from OmniDimension.");
        loadData();
      }
    } catch (err) {
      toast.error("Error communicating with OmniDimension sync API.");
    } finally {
      setSyncing(false);
    }
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
        toast.success("AI voice call initiated successfully!");
        setCallModalRecord(null);
        loadData();
      }
    } catch (err) {
      toast.error("Unexpected error occurred while initiating call.");
    } finally {
      setDispatching(false);
    }
  };

  const handleRetryCall = async (previousAttemptId: string) => {
    setRetryingId(previousAttemptId);
    try {
      const res = await fetch("/api/calls/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousAttemptId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to dispatch retry call.");
      } else {
        toast.success(data.message || "Retry call dispatched successfully!");
        loadData();
        if (selectedCall?.id === previousAttemptId && data.callAttempt) {
          setSelectedCall(data.callAttempt);
        }
      }
    } catch (err) {
      toast.error("Unexpected error retrying call.");
    } finally {
      setRetryingId(null);
    }
  };

  const [campaignRunning, setCampaignRunning] = useState(false);

  const handleDispatchCampaign = async () => {
    const eligibleToCall = filteredVerifications.filter(
      (v) => v.isEligibleForCall && !v.isCallLocked && !v.isCurrentlyCalling
    );
    const lockedCount = filteredVerifications.filter((v) => v.isCallLocked).length;

    if (eligibleToCall.length === 0) {
      if (lockedCount > 0) {
        toast.info(`All ${lockedCount} contact(s) in this location have already answered and are permanently call-locked.`);
      } else {
        toast.info("No eligible contacts ready to call in the current geographic selection.");
      }
      return;
    }

    const confirmRun = window.confirm(
      `Dispatch outbound AI voice campaign to ${eligibleToCall.length} eligible contact(s)?\n\nNote: ${lockedCount} answered & locked contact(s) will be automatically protected and skipped.`
    );
    if (!confirmRun) return;

    setCampaignRunning(true);
    let dispatched = 0;
    let skipped = lockedCount;

    for (const contact of eligibleToCall) {
      try {
        const res = await fetch("/api/calls/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationSheetId: contact.id }),
        });
        if (res.ok) {
          dispatched++;
        } else {
          skipped++;
        }
      } catch (err) {
        skipped++;
      }
    }

    setCampaignRunning(false);
    toast.success(`Campaign finished: ${dispatched} call(s) dispatched, ${skipped} protected/skipped.`);
    loadData();
  };

  // Metrics
  const totalEligible = verifications.length;
  const callsLocked = verifications.filter((v) => v.isCallLocked).length;
  const callsDispatched = callHistory.length;
  const callsCompleted = callHistory.filter((c) => c.status === "COMPLETED").length;
  const callsActive = callHistory.filter((c) => c.status === "DISPATCHED" || c.status === "IN_PROGRESS").length;
  const callsFailed = callHistory.filter((c) => c.status === "FAILED" || c.status === "BUSY" || c.status === "NO_ANSWER").length;

  // Filtered Contacts
  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch =
      v.convenerName.toLowerCase().includes(search.toLowerCase()) ||
      v.churchMinistryName.toLowerCase().includes(search.toLowerCase()) ||
      v.contactNumber.includes(search) ||
      (v.state && v.state.toLowerCase().includes(search.toLowerCase())) ||
      (v.district && v.district.toLowerCase().includes(search.toLowerCase())) ||
      v.reportId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "LOCKED") return v.isCallLocked;
    if (statusFilter === "NOT_CALLED") return !v.latestCallAttempt && !v.isCallLocked;
    if (statusFilter === "COMPLETED") return v.latestCallAttempt?.status === "COMPLETED";
    if (statusFilter === "ACTIVE") return v.latestCallAttempt?.status === "DISPATCHED" || v.latestCallAttempt?.status === "IN_PROGRESS";
    if (statusFilter === "FAILED_BUSY") {
      const s = v.latestCallAttempt?.status;
      return s === "FAILED" || s === "BUSY" || s === "NO_ANSWER";
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  AI Calling Center
                </h1>
                <p className="text-xs text-foreground/50 font-medium">
                  Autonomous outbound voice outreach powered by OmniDimension AI (Telugu & English).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleDispatchCampaign}
              disabled={campaignRunning || loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Dispatch outbound AI voice call to all eligible, non-locked contacts in this geographical scope"
            >
              <PhoneForwarded className={`h-3.5 w-3.5 ${campaignRunning ? "animate-spin" : ""}`} />
              {campaignRunning ? "Running Campaign..." : "Dispatch Campaign"}
            </button>
            <button
              onClick={handleSyncWithProvider}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/80 text-foreground/70 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Synchronize real-time call durations and recordings from OmniDimension"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-primary" : ""}`} />
              {syncing ? "Syncing..." : "Sync Logs"}
            </button>
            <button
              onClick={() => router.push("/admin/completed-verifications")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer"
            >
              Completed Verifications
            </button>
          </div>
        </div>

        {/* Hierarchical Geographic Dependent Filter Bar */}
        <GeographicFilterBar onFilterChange={handleGeoFilterChange} />

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl border border-border/50 glass-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
              Eligible Contacts
            </span>
            <p className="text-2xl font-black text-foreground">{totalEligible}</p>
            <span className="text-[9px] text-foreground/40 font-semibold">From completed sheets</span>
          </div>

          <div className="p-4 rounded-2xl border border-border/50 glass-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
              Calls Dispatched
            </span>
            <p className="text-2xl font-black text-indigo-500 dark:text-indigo-400">{callsDispatched}</p>
            <span className="text-[9px] text-foreground/40 font-semibold">Total call attempts</span>
          </div>

          <div className="p-4 rounded-2xl border border-border/50 glass-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
              Calls Answered
            </span>
            <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400">{callsCompleted}</p>
            <span className="text-[9px] text-foreground/40 font-semibold">Verified conversations</span>
          </div>

          <div className="p-4 rounded-2xl border border-border/50 glass-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
              Active / Dialing
            </span>
            <p className="text-2xl font-black text-blue-500 dark:text-blue-400">{callsActive}</p>
            <span className="text-[9px] text-foreground/40 font-semibold">In flight now</span>
          </div>

          <div className="p-4 rounded-2xl border border-border/50 glass-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
              Answered & Locked
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{callsLocked}</p>
            <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold">Protected from re-call</span>
          </div>

          <div className="p-4 rounded-2xl border border-border/50 glass-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 block mb-1">
              Failed / Busy
            </span>
            <p className="text-2xl font-black text-amber-500 dark:text-amber-400">{callsFailed}</p>
            <span className="text-[9px] text-foreground/40 font-semibold">Eligible for retry</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-border/50 glass-card">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts, churches, phone numbers, or report IDs..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border/50 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-border/50 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="ALL">All Contacts</option>
              <option value="NOT_CALLED">Not Called Yet</option>
              <option value="ACTIVE">Dialing / Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED_BUSY">Failed / Busy / No Answer</option>
            </select>
          </div>
        </div>

        {/* Main Content Layout: Contact Cards + Call Details / History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Eligible Contacts to Call (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Eligible Contacts ({filteredVerifications.length})
              </h2>
              <span className="text-[10px] text-foreground/40 font-semibold">
                Click contact to inspect call timeline
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-foreground/40 font-medium rounded-2xl border border-border/40 glass-card">
                <div className="h-7 w-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
                <span className="text-xs uppercase font-bold tracking-wider">Loading Contacts...</span>
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="p-12 text-center text-foreground/40 font-medium italic rounded-2xl border border-border/40 glass-card">
                No verified contacts matching the current filter.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredVerifications.map((v) => {
                  const latest = v.latestCallAttempt;
                  const isSelected = selectedCall?.verificationSheetId === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (latest) setSelectedCall(latest);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                          : "border-border/50 glass-card hover:bg-accent/40"
                      }`}
                    >
                      {/* Left: Contact Info */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {v.reportId}
                          </span>
                          <span className="font-bold text-foreground text-xs truncate max-w-55">
                            {v.convenerName}
                          </span>
                          <span className="text-[10px] text-foreground/40 truncate max-w-37.5">
                            · {v.churchMinistryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-foreground/60 flex-wrap">
                          <span className="font-mono font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3 text-foreground/40" />
                            {v.formattedPhone}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-foreground/40" />
                            {v.stateDistrictCity}
                          </span>
                        </div>

                        {/* Geographic Hierarchy Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {v.state}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {v.district}
                          </span>
                          {latest?.recordingUrl && (
                            <div className="ml-auto sm:ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <CallAudioPlayer
                                compact
                                src={latest.recordingUrl}
                                callId={latest.id}
                                contactName={v.convenerName}
                                duration={latest.duration}
                                durationFormatted={latest.durationFormatted}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Call Status & Action Button */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Status badge */}
                        {v.isCallLocked ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Answered — Calls Locked
                          </span>
                        ) : !latest ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/50 border border-border/40">
                            Ready to Call
                          </span>
                        ) : latest.status === "COMPLETED" ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Answered {latest.durationFormatted ? `(${latest.durationFormatted})` : ""}
                          </span>
                        ) : latest.status === "DISPATCHED" || latest.status === "IN_PROGRESS" ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                            Dialing
                          </span>
                        ) : latest.status === "NO_ANSWER" ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <PhoneMissed className="h-3 w-3" />
                            No Answer (0:00)
                          </span>
                        ) : latest.status === "BUSY" ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <PhoneOff className="h-3 w-3" />
                            Busy Line
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {latest.status} (#{latest.attemptNumber})
                          </span>
                        )}

                        {/* Call / Retry button */}
                        {v.isCallLocked ? (
                          <button
                            disabled
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75 shadow-xs"
                            title={v.callLockedReason || "Verification call was answered by recipient. Further calling is permanently locked."}
                          >
                            <Lock className="h-3 w-3" />
                            Locked
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (latest && (latest.status === "FAILED" || latest.status === "BUSY" || latest.status === "NO_ANSWER")) {
                                handleRetryCall(latest.id);
                              } else {
                                setCallModalRecord(v);
                              }
                            }}
                            disabled={v.isCurrentlyCalling || retryingId === latest?.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                              v.isCurrentlyCalling || retryingId === latest?.id
                                ? "bg-foreground/10 text-foreground/40 cursor-not-allowed"
                                : "text-white hover:opacity-95"
                            }`}
                            style={{
                              background: v.isCurrentlyCalling ? undefined : "var(--gradient-accent)",
                            }}
                          >
                            <PhoneCall className="h-3 w-3" />
                            {retryingId === latest?.id
                              ? "Retrying..."
                              : latest
                              ? "Retry"
                              : "Call"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Call Attempt Detail & Recording Player (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground/70 flex items-center gap-2 px-1">
              <History className="h-4 w-4 text-primary" />
              Call Attempt & Outcome Details
            </h2>

            {!selectedCall ? (
              <div className="p-8 text-center text-foreground/40 rounded-3xl border border-dashed border-border/60 glass-card">
                <Volume2 className="h-10 w-10 mx-auto text-foreground/20 mb-2" />
                <p className="text-xs font-bold text-foreground/60">No call selected</p>
                <p className="text-[11px] text-foreground/40 mt-1">
                  Click any contact on the left to inspect call duration, recording playback, transcript, and AI summary.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-3xl border border-border/50 glass-card space-y-5 text-left animate-fadeIn">
                {/* Header of Detail */}
                <div className="flex items-start justify-between border-b border-border/40 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        Attempt #{selectedCall.attemptNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                        {new Date(selectedCall.initiatedAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-foreground mt-1">
                      {selectedCall.contactName}
                    </h3>
                    <p className="text-[11px] text-foreground/50">{selectedCall.churchName}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedCall.status === "COMPLETED"
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                        : selectedCall.status === "DISPATCHED" || selectedCall.status === "IN_PROGRESS"
                        ? "bg-blue-500/15 text-blue-500 border-blue-500/30 animate-pulse"
                        : selectedCall.status === "NO_ANSWER"
                        ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                        : selectedCall.status === "BUSY"
                        ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                        : "bg-red-500/15 text-red-500 border-red-500/30"
                    }`}
                  >
                    {selectedCall.status === "NO_ANSWER" ? "NO ANSWER" : selectedCall.status}
                  </span>
                </div>

                {/* Duration & Numbers info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 block mb-0.5">
                      Destination
                    </span>
                    <span className="font-mono font-bold text-foreground">{selectedCall.toNumber}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-accent/30 border border-border/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 block mb-0.5">
                      Confirmed Duration
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedCall.durationFormatted || (selectedCall.duration !== null && selectedCall.duration !== undefined ? `${selectedCall.duration}s` : "Pending")}
                    </span>
                  </div>
                </div>

                {/* Audio Recording Player */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-primary" />
                    Call Audio Recording
                  </span>
                  {selectedCall.recordingUrl ? (
                    <CallAudioPlayer
                      src={selectedCall.recordingUrl}
                      callId={selectedCall.id}
                      contactName={selectedCall.contactName}
                      duration={selectedCall.duration}
                      durationFormatted={selectedCall.durationFormatted}
                    />
                  ) : (
                    <div className="p-3 rounded-2xl bg-foreground/5 border border-border/30 text-center text-xs text-foreground/40 italic">
                      {selectedCall.status === "COMPLETED"
                        ? "Audio recording link not supplied by provider or processing."
                        : selectedCall.status === "NO_ANSWER"
                        ? "No recording available (call was not answered by recipient)."
                        : selectedCall.status === "BUSY"
                        ? "No recording available (recipient's line was busy)."
                        : selectedCall.status === "FAILED"
                        ? "No recording available (call failed to connect)."
                        : "Recording will be available once the call completes."}
                    </div>
                  )}
                </div>

                {/* AI Sentiment & Summary */}
                {selectedCall.summary && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        AI Call Summary
                      </span>
                      {selectedCall.sentiment && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          Sentiment: {selectedCall.sentiment}
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 rounded-2xl bg-accent/30 border border-border/30 text-xs text-foreground/80 leading-relaxed">
                      {selectedCall.summary}
                    </div>
                  </div>
                )}

                {/* Conversation Transcript */}
                {selectedCall.transcript && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                      Conversation Transcript
                    </span>
                    <div className="max-h-56 overflow-y-auto p-3.5 rounded-2xl bg-background/80 border border-border/40 text-xs space-y-2 divide-y divide-border/20">
                      <div 
                        className="prose prose-xs dark:prose-invert max-w-none text-[11px] leading-relaxed text-foreground/80"
                        dangerouslySetInnerHTML={{ __html: selectedCall.transcript }}
                      />
                    </div>
                  </div>
                )}

                {/* Retry action footer */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] text-foreground/40 font-semibold">
                    Provider ID: {selectedCall.providerCallId || selectedCall.providerRequestId || "N/A"}
                  </span>
                  <button
                    onClick={() => handleRetryCall(selectedCall.id)}
                    disabled={retryingId === selectedCall.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 hover:bg-accent text-xs font-bold text-foreground cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`h-3 w-3 ${retryingId === selectedCall.id ? "animate-spin" : ""}`} />
                    {retryingId === selectedCall.id ? "Retrying..." : "Retry This Call"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Dispatch AI Call Confirmation */}
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
