"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { 
  History, Search, User, Phone, MapPin, Calendar, Clock, 
  CheckCircle2, AlertCircle, X, ChevronRight, Eye, Sparkles, 
  RefreshCw, Building, Hotel, Navigation, Plane, Car, Train, Bus,
  Sunrise, Sun, Moon, ArrowLeft, ExternalLink, Image as ImageIcon,
  Video as VideoIcon, FileSpreadsheet, ClipboardList, Check, Copy,
  Edit2, UserCheck, ShieldCheck, Users, ArrowUpRight, ArrowRight, Play
} from "lucide-react";
import { toast } from "sonner";
import { MediaViewer } from "@/components/media-viewer";

export default function PreviousMeetingsPage() {
  const router = useRouter();
  const { user } = useUIStore();

  // Search & Person selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Selected person details & meeting history
  const [personData, setPersonData] = useState<any | null>(null);
  const [loadingPerson, setLoadingPerson] = useState(false);

  // Edit Person Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Detailed Full Meeting Form Preview Modal state (Section 5)
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [meetingHistoryData, setMeetingHistoryData] = useState<any | null>(null);
  const [loadingMeetingHistory, setLoadingMeetingHistory] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"verification" | "attendance" | "evaluation">("verification");

  // Initial fetch of active persons or search
  useEffect(() => {
    const fetchPersons = async () => {
      setSearching(true);
      try {
        const url = searchQuery.trim() 
          ? `/api/admin/persons?search=${encodeURIComponent(searchQuery.trim())}&limit=20`
          : `/api/admin/persons?limit=15`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.persons || []);
          // Auto select first person if none selected
          if (!selectedPersonId && data.persons?.length > 0 && !searchQuery.trim()) {
            setSelectedPersonId(data.persons[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load persons:", err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchPersons, searchQuery.trim() ? 250 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch full history of selected person
  const fetchPersonHistory = async (id: string) => {
    setLoadingPerson(true);
    try {
      const res = await fetch(`/api/admin/persons/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load person history");
      }
      const data = await res.json();
      setPersonData(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load person data");
    } finally {
      setLoadingPerson(false);
    }
  };

  useEffect(() => {
    if (selectedPersonId) {
      fetchPersonHistory(selectedPersonId);
    }
  }, [selectedPersonId]);

  // Open Full Meeting History Modal (Section 5)
  const openMeetingFullHistory = async (meetingId: string) => {
    setActiveMeetingId(meetingId);
    setActiveFormTab("verification");
    setLoadingMeetingHistory(true);
    try {
      const res = await fetch(`/api/admin/meetings/${meetingId}/full-history`);
      if (!res.ok) {
        throw new Error("Failed to load meeting full history");
      }
      const data = await res.json();
      setMeetingHistoryData(data.meeting);
    } catch (err: any) {
      toast.error(err.message || "Failed to load full meeting forms");
    } finally {
      setLoadingMeetingHistory(false);
    }
  };

  // Open Edit Person Modal
  const openEditPerson = () => {
    if (!personData?.person) return;
    setEditName(personData.person.name || "");
    setEditPhone(personData.person.phoneNumber || "");
    setEditNotes(personData.person.notes || "");
    setEditModalOpen(true);
  };

  // Save Person Edits
  const handleEditPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !editName.trim()) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/persons/${selectedPersonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phoneNumber: editPhone.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update person");
      } else {
        toast.success("Person details updated successfully!");
        setEditModalOpen(false);
        fetchPersonHistory(selectedPersonId);
      }
    } catch (err) {
      toast.error("An error occurred while saving person details");
    } finally {
      setEditSubmitting(false);
    }
  };

  const copyPersonId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Person ID copied to clipboard!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                <History className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Previous Meeting Preview
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                    Person-Wise History
                  </span>
                </div>
                <p className="text-xs text-foreground/50 font-medium">
                  Track every outreach meeting arranged or referred by a specific person and access their complete Verification, Attendance, and Evaluation forms.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (selectedPersonId) fetchPersonHistory(selectedPersonId);
              }}
              disabled={loadingPerson}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/80 text-foreground/70 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingPerson ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => router.push("/admin/calendar")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md hover:opacity-95"
              style={{ background: "var(--gradient-accent)" }}
            >
              <Calendar className="h-4 w-4" />
              View Calendar
            </button>
          </div>
        </div>

        {/* Search Bar (Section 3) */}
        <div className="p-4 rounded-2xl border border-border/50 glass-card space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Person Name (e.g. Teja), Phone Number, or Person ID..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-border/60 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Select Person Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-black uppercase text-foreground/50 tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" />
              Registered Persons:
            </span>
            {searching ? (
              <span className="text-xs text-foreground/40">Searching...</span>
            ) : searchResults.length > 0 ? (
              searchResults.map((p) => {
                const isSelected = selectedPersonId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersonId(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs font-black ring-2 ring-primary/30"
                        : "bg-card border border-border/50 text-foreground/70 hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                      isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    }`}>
                      {p.totalMeetings}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-foreground/40">No matching persons found.</span>
            )}
          </div>
        </div>

        {/* Selected Person Profile & Meeting History */}
        {loadingPerson ? (
          <div className="p-12 text-center rounded-2xl border border-border/50 glass-card space-y-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-bold text-foreground/70">Loading person profile & meeting records...</p>
          </div>
        ) : personData?.person ? (
          <div className="space-y-6">
            {/* 1. PERSON PROFILE CARD & DYNAMIC STATS (Section 3) */}
            <div className="p-5 sm:p-6 rounded-3xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-13 w-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md">
                    {personData.person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {personData.person.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        Meeting Coordinator / Referral
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                      {personData.person.phoneNumber ? (
                        <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <a href={`tel:${personData.person.phoneNumber}`} className="hover:underline">
                            {personData.person.phoneNumber}
                          </a>
                        </div>
                      ) : (
                        <span className="text-foreground/40">No phone provided</span>
                      )}

                      <div className="flex items-center gap-1 font-mono text-[11px] text-foreground/50">
                        <span>ID:</span>
                        <span>{personData.person.id}</span>
                        <button
                          onClick={() => copyPersonId(personData.person.id)}
                          title="Copy Person ID"
                          className="hover:text-primary cursor-pointer p-0.5"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={openEditPerson}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-accent text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="p-3 rounded-2xl border border-border/50 bg-card/80 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">Total Arranged</span>
                  <p className="text-2xl font-black text-foreground">{personData.stats.totalMeetings}</p>
                </div>

                <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Completed</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{personData.stats.completedMeetings}</p>
                </div>

                <div className="p-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Upcoming</span>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{personData.stats.upcomingMeetings}</p>
                </div>

                <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">On Hold</span>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{personData.stats.onHoldMeetings}</p>
                </div>

                <div className="p-3 rounded-2xl border border-slate-500/30 bg-slate-500/10 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Cancelled</span>
                  <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{personData.stats.cancelledMeetings}</p>
                </div>

                <div className="p-3 rounded-2xl border border-border/50 bg-card/80 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">First Meeting</span>
                  <p className="text-xs font-bold text-foreground truncate mt-1.5">
                    {personData.stats.firstMeetingDate 
                      ? new Date(personData.stats.firstMeetingDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl border border-border/50 bg-card/80 text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">Latest Meeting</span>
                  <p className="text-xs font-bold text-foreground truncate mt-1.5">
                    {personData.stats.latestMeetingDate 
                      ? new Date(personData.stats.latestMeetingDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {personData.person.notes && (
                <div className="p-3 rounded-xl bg-card border border-border/50 text-xs text-foreground/80">
                  <span className="font-bold text-foreground">Notes: </span>
                  <span>{personData.person.notes}</span>
                </div>
              )}
            </div>

            {/* 2. ALL PREVIOUS MEETINGS LIST (Section 4) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">
                    All Meetings Arranged by {personData.person.name} ({personData.meetings?.length || 0})
                  </h3>
                  <p className="text-xs text-foreground/50 font-medium">
                    Sorted by meeting date (latest meetings displayed first). Click any meeting to open its full Verification, Attendance, and Evaluation history.
                  </p>
                </div>
              </div>

              {personData.meetings?.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border/60 glass-card space-y-2">
                  <Calendar className="h-8 w-8 text-foreground/30 mx-auto" />
                  <p className="text-sm font-bold text-foreground/70">No meetings linked to {personData.person.name} yet.</p>
                  <p className="text-xs text-foreground/50">
                    When filling out a Verification Form, select "{personData.person.name}" under "Meeting Arranged By" to link meetings here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {personData.meetings.map((m: any) => (
                    <div
                      key={m.meetingId}
                      onClick={() => openMeetingFullHistory(m.meetingId)}
                      className="p-4 sm:p-5 rounded-2xl border border-border/60 glass-card hover:border-primary/50 transition-all cursor-pointer group space-y-3 shadow-xs hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary font-mono font-black text-xs">
                            {m.reportId}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                                {m.churchMinistryName || m.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                m.bookingStatus === "CONFIRMED"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : m.bookingStatus === "ON_HOLD"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : "bg-slate-500/15 text-slate-500 border border-slate-500/30"
                              }`}>
                                {m.bookingStatus}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/60 font-medium">
                              Convener / Attendee: <span className="font-bold text-foreground">{m.convenerName || "Not Specified"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                            <span>Open Forms History</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>

                      {/* Meeting Logistics Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-foreground/40 block">Meeting Date</span>
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{m.meetingDates || "Date Not Set"}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-foreground/40 block">Location / City</span>
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{m.meetingCity || "Location Not Assigned"}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-foreground/40 block">Session & Travel</span>
                          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <span className="font-bold">{m.meetingSession}</span>
                            <span>•</span>
                            <span className="font-bold">{m.travelMode}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-foreground/40 block">Stay Location</span>
                          <div className="flex items-center gap-1.5 font-bold text-foreground truncate">
                            <Hotel className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{m.stayLocation || "Not specified"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Form Submission Pipeline Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30 text-[10px] font-bold">
                        <span className="text-foreground/40 uppercase font-black mr-1">Associated Forms:</span>

                        {/* Verification Form Status */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          m.verificationStatus === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : m.verificationStatus === "SUBMITTED"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                          Verification ({m.verificationStatus}) {m.verificationMediaCount > 0 ? `• ${m.verificationMediaCount} img` : ""}
                        </span>

                        {/* Attendance Form Status */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          m.attendanceStatus === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : m.attendanceStatus === "SUBMITTED"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-slate-500/10 text-slate-500 border-slate-500/30"
                        }`}>
                          <FileSpreadsheet className="h-3 w-3" />
                          Attendance ({m.attendanceStatus})
                        </span>

                        {/* Evaluation Form Status */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          m.evaluationStatus === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : m.evaluationStatus === "SUBMITTED"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-slate-500/10 text-slate-500 border-slate-500/30"
                        }`}>
                          <ClipboardList className="h-3 w-3" />
                          Evaluation ({m.evaluationStatus}) {m.evaluationMediaCount > 0 ? `• ${m.evaluationMediaCount} media` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/60 glass-card space-y-2">
            <User className="h-8 w-8 text-foreground/30 mx-auto" />
            <p className="text-sm font-bold text-foreground/70">No person selected</p>
            <p className="text-xs text-foreground/50">Search for a person above to view their meeting history.</p>
          </div>
        )}

        {/* 3. COMPLETE FORM HISTORY MODAL (Section 5) */}
        {activeMeetingId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
            <div className="bg-card text-foreground rounded-3xl border border-border/60 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-border/40 flex items-center justify-between gap-4 bg-accent/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                        {meetingHistoryData?.reportId || "Meeting History"} • {meetingHistoryData?.title || "Outreach Report"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-primary/15 text-primary border border-primary/30 uppercase">
                        {meetingHistoryData?.status || "REPORT"}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 font-medium">
                      Leader: <span className="font-bold text-foreground">{meetingHistoryData?.leader?.name || meetingHistoryData?.leader?.username}</span> • Arranged By: <span className="font-bold text-indigo-600 dark:text-indigo-400">{personData?.person?.name}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveMeetingId(null);
                    setMeetingHistoryData(null);
                  }}
                  className="p-2 rounded-xl border border-border/50 hover:bg-accent text-foreground/60 hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex border-b border-border/40 px-3 sm:px-6 bg-accent/10 shrink-0 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveFormTab("verification")}
                  className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-11 ${
                    activeFormTab === "verification"
                      ? "border-primary text-primary font-black"
                      : "border-transparent text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>A. Verification Form</span>
                </button>
                <button
                  onClick={() => setActiveFormTab("attendance")}
                  className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-11 ${
                    activeFormTab === "attendance"
                      ? "border-primary text-primary font-black"
                      : "border-transparent text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>B. Attendance Form</span>
                </button>
                <button
                  onClick={() => setActiveFormTab("evaluation")}
                  className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-11 ${
                    activeFormTab === "evaluation"
                      ? "border-primary text-primary font-black"
                      : "border-transparent text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>C. Evaluation Form</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {loadingMeetingHistory ? (
                  <div className="p-12 text-center space-y-3">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
                    <p className="text-sm font-bold text-foreground/70">Retrieving form records from database...</p>
                  </div>
                ) : (
                  <>
                    {/* SECTION A: VERIFICATION FORM */}
                    {activeFormTab === "verification" && (
                      <div className="space-y-6">
                        {meetingHistoryData?.verificationSheet ? (
                          <>
                            {/* Basic Details Box */}
                            <div className="p-4 rounded-2xl border border-border/50 bg-card space-y-4">
                              <h4 className="text-xs font-black uppercase tracking-wider text-primary border-b border-border/40 pb-2">
                                Basic Outreach & Referral Details
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Convener Name</span>
                                  <span className="font-bold text-foreground text-sm">{meetingHistoryData.verificationSheet.convenerName}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Church / Ministry</span>
                                  <span className="font-bold text-foreground text-sm">{meetingHistoryData.verificationSheet.churchMinistryName}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Contact Phone</span>
                                  <span className="font-bold font-mono text-foreground text-sm">{meetingHistoryData.verificationSheet.contactNumber}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Meeting Dates</span>
                                  <span className="font-bold text-foreground">{meetingHistoryData.verificationSheet.meetingDates}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Location / City</span>
                                  <span className="font-bold text-foreground">{meetingHistoryData.verificationSheet.stateDistrictCity}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Meeting Session</span>
                                  <span className="font-bold text-foreground">{meetingHistoryData.verificationSheet.meetingSession || "Morning"}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Travel Mode</span>
                                  <span className="font-bold text-foreground">{meetingHistoryData.verificationSheet.travelMode || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Stay Location</span>
                                  <span className="font-bold text-foreground">{meetingHistoryData.verificationSheet.stayLocation || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Arranged By</span>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {meetingHistoryData.verificationSheet.arrangedByPerson?.name || meetingHistoryData.verificationSheet.arrangedByName || personData?.person?.name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Ministry Background */}
                            <div className="p-4 rounded-2xl border border-border/50 bg-card space-y-4">
                              <h4 className="text-xs font-black uppercase tracking-wider text-primary border-b border-border/40 pb-2">
                                Ministry Background & Attendance
                              </h4>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-2.5 rounded-xl bg-accent/40 text-center">
                                  <span className="text-[10px] font-black uppercase text-foreground/50 block">Days</span>
                                  <span className="font-black text-foreground text-lg">{meetingHistoryData.verificationSheet.numberOfDays}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-accent/40 text-center">
                                  <span className="text-[10px] font-black uppercase text-foreground/50 block">Expected Attendance</span>
                                  <span className="font-black text-foreground text-lg">{meetingHistoryData.verificationSheet.expectedAttendance}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-accent/40 text-center">
                                  <span className="text-[10px] font-black uppercase text-foreground/50 block">Church Members</span>
                                  <span className="font-black text-foreground text-lg">{meetingHistoryData.verificationSheet.churchMembers}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-accent/40 text-center">
                                  <span className="text-[10px] font-black uppercase text-foreground/50 block">Workers / Leaders</span>
                                  <span className="font-black text-foreground text-lg">{meetingHistoryData.verificationSheet.workersLeaders}</span>
                                </div>
                              </div>
                            </div>

                            {/* Verification Images Gallery */}
                            <div className="p-4 rounded-2xl border border-border/50 bg-card space-y-3">
                              <MediaViewer 
                                media={(meetingHistoryData.verificationSheet.media || []).map((m: any) => ({
                                  ...m,
                                  fileUrl: m.url || m.fileUrl,
                                  mediaType: "IMAGE",
                                }))}
                                title={`Verification Images (${meetingHistoryData.verificationSheet.media?.length || 0})`}
                                kind="IMAGES"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 space-y-2">
                            <p className="text-sm font-bold text-foreground/60">Verification Form Not Submitted Yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION B: ATTENDANCE FORM */}
                    {activeFormTab === "attendance" && (
                      <div className="space-y-4">
                        {meetingHistoryData?.attendanceRecord && meetingHistoryData.attendanceRecord.status !== "PENDING" ? (
                          <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-4">
                            <div className="flex items-center justify-between border-b border-border/40 pb-3">
                              <h4 className="text-sm font-black text-foreground">
                                Attendance Record Information
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {meetingHistoryData.attendanceRecord.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Meeting Date</span>
                                <span className="font-bold text-foreground">
                                  {meetingHistoryData.attendanceRecord.date ? new Date(meetingHistoryData.attendanceRecord.date).toLocaleDateString() : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Location</span>
                                <span className="font-bold text-foreground">{meetingHistoryData.attendanceRecord.location}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Field Executer</span>
                                <span className="font-bold text-foreground">{meetingHistoryData.attendanceRecord.fieldExecuter}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Coordinator</span>
                                <span className="font-bold text-foreground">{meetingHistoryData.attendanceRecord.coordinator}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Members Attended</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                                  {meetingHistoryData.attendanceRecord.membersAttended}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Pastors Attended</span>
                                <span className="font-black text-blue-600 dark:text-blue-400 text-base">
                                  {meetingHistoryData.attendanceRecord.pastorsAttended}
                                </span>
                              </div>
                            </div>

                            {meetingHistoryData.attendanceRecord.remarks && (
                              <div className="p-3 rounded-xl bg-accent/30 border border-border/40 text-xs text-foreground/80 space-y-0.5">
                                <span className="text-[10px] font-black uppercase text-foreground/40 block">Remarks</span>
                                <p>{meetingHistoryData.attendanceRecord.remarks}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-12 text-center rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 space-y-2">
                            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                            <h4 className="text-sm font-black text-foreground">
                              Attendance Form Not Submitted Yet
                            </h4>
                            <p className="text-xs text-foreground/60 max-w-md mx-auto">
                              The outreach meeting attendance record has not been finalized and submitted by the assigned coordinator.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION C: EVALUATION FORM */}
                    {activeFormTab === "evaluation" && (
                      <div className="space-y-6">
                        {meetingHistoryData?.afterMeetingReport && meetingHistoryData.afterMeetingReport.status !== "PENDING" ? (
                          <>
                            {/* Evaluation Report Details */}
                            <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-4">
                              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                <div>
                                  <h4 className="text-sm font-black text-foreground">
                                    After-Meeting Evaluation Report
                                  </h4>
                                  <p className="text-xs text-foreground/50">
                                    Submitted by {meetingHistoryData.afterMeetingReport.coordinatorName} ({meetingHistoryData.afterMeetingReport.designation})
                                  </p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  {meetingHistoryData.afterMeetingReport.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 rounded-xl bg-accent/25 space-y-1">
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Overall Meeting Outcome</span>
                                  <p className="font-medium text-foreground">{meetingHistoryData.afterMeetingReport.overallMeetingOutcome}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-accent/25 space-y-1">
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Congregation Response</span>
                                  <p className="font-medium text-foreground">{meetingHistoryData.afterMeetingReport.congregationResponse}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-accent/25 space-y-1">
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Strengths Observed</span>
                                  <p className="font-medium text-foreground">{meetingHistoryData.afterMeetingReport.strengthsObserved}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-accent/25 space-y-1">
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Challenges Observed</span>
                                  <p className="font-medium text-foreground">{meetingHistoryData.afterMeetingReport.challengesObserved}</p>
                                </div>
                                <div className="md:col-span-2 p-3 rounded-xl bg-accent/25 space-y-1">
                                  <span className="text-[10px] font-black uppercase text-foreground/40 block">Opportunity for WCM</span>
                                  <p className="font-medium text-foreground">{meetingHistoryData.afterMeetingReport.opportunityForWcm}</p>
                                </div>
                              </div>
                            </div>

                            {/* Evaluation Media (Images + Video) */}
                            <div className="p-5 rounded-2xl border border-border/50 bg-card space-y-4">
                              <MediaViewer 
                                media={(meetingHistoryData.afterMeetingReport.media || []).map((m: any) => ({
                                  ...m,
                                  fileUrl: m.url || m.fileUrl,
                                }))}
                                title={`Evaluation Media (${meetingHistoryData.afterMeetingReport.media?.length || 0})`}
                                kind="ALL"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="p-12 text-center rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 space-y-2">
                            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                            <h4 className="text-sm font-black text-foreground">
                              Evaluation Form Not Submitted Yet
                            </h4>
                            <p className="text-xs text-foreground/60 max-w-md mx-auto">
                              The After-Meeting Evaluation Report has not been submitted by the coordinator yet.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-border/40 flex items-center justify-between bg-accent/15 shrink-0">
                <button
                  onClick={() => {
                    setActiveMeetingId(null);
                    setMeetingHistoryData(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 hover:bg-accent text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Meeting History</span>
                </button>

                <div className="flex items-center gap-2">
                  {meetingHistoryData?.id && (
                    <button
                      onClick={() => router.push(`/coordinator/report/${meetingHistoryData.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <span>Open Full Meeting Editor</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. EDIT PERSON DETAILS MODAL (Section 8) */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-card text-foreground rounded-3xl border border-border/60 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">Edit Person Profile</h3>
                    <p className="text-xs text-foreground/50">Maintain unique person identity across all meetings</p>
                  </div>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="text-foreground/40 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditPersonSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border/60 hover:bg-accent text-foreground/70 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
