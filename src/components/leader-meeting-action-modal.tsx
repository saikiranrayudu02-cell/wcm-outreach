"use client";

import React, { useEffect, useState } from "react";
import { 
  X, Check, UserCheck, Send, MapPin, Calendar, 
  User, Shield, AlertCircle, Loader2, Sparkles, Phone, Mail, Search
} from "lucide-react";
import { toast } from "sonner";
import { formatRoleBadge } from "@/lib/translations";

interface LeaderActionModalProps {
  meeting: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeaderMeetingActionModal({ meeting, onClose, onSuccess }: LeaderActionModalProps) {
  const [mode, setMode] = useState<"CHOICE" | "FORWARD">("CHOICE");
  const [submitting, setSubmitting] = useState(false);

  // Coordinators state
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [selectedCoordId, setSelectedCoordId] = useState<string>("");
  const [coordRemarks, setCoordRemarks] = useState("");
  const [coordSearch, setCoordSearch] = useState("");
  const [confirmForward, setConfirmForward] = useState(false);

  useEffect(() => {
    if (meeting && mode === "FORWARD") {
      fetchCoordinators();
    }
  }, [meeting, mode]);

  const fetchCoordinators = async () => {
    if (!meeting) return;
    setLoadingCoords(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/eligible-coordinators`);
      if (res.ok) {
        const data = await res.json();
        setCoordinators(data.coordinators || []);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to load eligible coordinators");
      }
    } catch {
      toast.error("Network error fetching coordinators");
    } finally {
      setLoadingCoords(false);
    }
  };

  const handleSelfHandle = async () => {
    if (!meeting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/self-handle`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Meeting marked for personal self-handling");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to update meeting");
      }
    } catch {
      toast.error("Network error while selecting self-handle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmForward = async () => {
    if (!meeting || !selectedCoordId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinatorId: selectedCoordId,
          remarks: coordRemarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Meeting successfully forwarded to coordinator");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to forward meeting");
      }
    } catch {
      toast.error("Network error forwarding meeting");
    } finally {
      setSubmitting(false);
    }
  };

  if (!meeting) return null;

  const filteredCoordinators = coordinators.filter((c) =>
    c.name.toLowerCase().includes(coordSearch.toLowerCase()) ||
    c.username.toLowerCase().includes(coordSearch.toLowerCase()) ||
    (c.district && c.district.toLowerCase().includes(coordSearch.toLowerCase()))
  );

  const selectedCoord = coordinators.find((c) => c.id === selectedCoordId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white animate-modal flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-7 border-b border-slate-800 bg-slate-900/95">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                {meeting.referenceId}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned Meeting Action
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              {mode === "CHOICE" ? "Choose How to Handle This Meeting" : "Forward Meeting to Coordinator"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Meeting Overview Pill */}
        <div className="bg-slate-800/40 border-b border-slate-800 p-4 px-7 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-left">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Person Arranging</span>
            <span className="font-bold text-white truncate block">{meeting.organizerName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date</span>
            <span className="font-bold text-slate-200 block">
              {new Date(meeting.meetingDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location</span>
            <span className="font-bold text-slate-200 truncate block">
              {meeting.district}, {meeting.state}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-left">
          {mode === "CHOICE" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                As the assigned leader, you have complete authority to decide whether to handle this meeting work personally or delegate it to one of your authorized local coordinators.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Option A: Self-Handle */}
                <div 
                  onClick={handleSelfHandle}
                  className="rounded-2xl p-5 border-2 border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group text-left"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm group-hover:text-indigo-300 transition-colors">
                        Option A: Handle Myself
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        Keep meeting assigned to you. You will directly coordinate and fill the Verification details.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Handle Myself
                    </button>
                  </div>
                </div>

                {/* Option B: Forward to Coordinator */}
                <div 
                  onClick={() => setMode("FORWARD")}
                  className="rounded-2xl p-5 border-2 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group text-left"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm group-hover:text-amber-300 transition-colors">
                        Option B: Forward to Coordinator
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        Select an authorized Coordinator in this district/territory to execute local meeting coordination.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      Select Coordinator
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode === FORWARD */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Target Coordinator
                </span>
                <button
                  onClick={() => {
                    setMode("CHOICE");
                    setConfirmForward(false);
                  }}
                  className="text-xs text-indigo-400 hover:underline cursor-pointer"
                >
                  &larr; Back to Options
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search coordinators by name or district..."
                  value={coordSearch}
                  onChange={(e) => setCoordSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Coordinator List */}
              {loadingCoords ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-400">Loading eligible coordinators...</span>
                </div>
              ) : filteredCoordinators.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-center text-xs text-slate-400">
                  <AlertCircle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                  No eligible coordinators found matching your criteria.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredCoordinators.map((c) => {
                    const isSelected = selectedCoordId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCoordId(c.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                            : "border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-200"
                          }`}>
                            {c.name[0]?.toUpperCase() || "C"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs truncate">{c.name}</span>
                              {c.isDistrictMatch && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold uppercase">
                                  District Match
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              @{c.username} &bull; {c.district || c.part || "General Area"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            c.activeMeetingsCount === 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-700/60 text-slate-300"
                          }`}>
                            {c.availabilityStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Remarks textarea */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Forwarding Instructions / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={coordRemarks}
                  onChange={(e) => setCoordRemarks(e.target.value)}
                  placeholder="e.g. Please reach out to John to verify the venue and confirm dates."
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Confirmation Prompt */}
              {selectedCoord && !confirmForward && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">Ready to forward?</p>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      You are about to assign meeting <strong>{meeting.referenceId}</strong> to Coordinator <strong>{selectedCoord.name}</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-7 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {mode === "FORWARD" && (
            <button
              onClick={handleConfirmForward}
              disabled={!selectedCoordId || submitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCoordId && !submitting
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Forwarding...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Confirm Forward
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
