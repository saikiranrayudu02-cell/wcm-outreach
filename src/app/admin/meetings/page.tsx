"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Calendar, Plus, Users, User, Search, Filter, History, Eye, CheckCircle2, 
  Send, UserCheck, Clock, MapPin, Phone, Mail, AlertCircle, Loader2, Sparkles, X, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { formatRoleBadge, formatRoleName } from "@/lib/translations";
import { MeetingAssignmentHistoryModal } from "@/components/meeting-assignment-history-modal";

export default function AdminMeetingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <AdminMeetingsContent />
    </Suspense>
  );
}

function AdminMeetingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "create";

  const [activeTab, setActiveTab] = useState<"create" | "assignments" | "all">(
    initialTab === "assignments" || initialTab === "all" ? initialTab : "create"
  );

  // States & Districts master data
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [loadingGeos, setLoadingGeos] = useState(true);

  // Create Meeting Form State
  const [meetingDate, setMeetingDate] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [assignmentRemarks, setAssignmentRemarks] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Leader Discovery State
  const [eligibleLeaders, setEligibleLeaders] = useState<any[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderRoleFilter, setLeaderRoleFilter] = useState<string>("ALL");

  // Meetings List State
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [listSearch, setListSearch] = useState("");
  const [listStateFilter, setListStateFilter] = useState("");
  const [listDistrictFilter, setListDistrictFilter] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState("");

  // History Modal State
  const [selectedMeetingForHistory, setSelectedMeetingForHistory] = useState<any | null>(null);

  // Fetch geographic options
  useEffect(() => {
    fetchGeographicOptions();
    fetchMeetings();
  }, []);

  const fetchGeographicOptions = async () => {
    setLoadingGeos(true);
    try {
      const res = await fetch("/api/admin/geographic-options");
      if (res.ok) {
        const data = await res.json();
        setAvailableStates(data.states || []);
      }
    } catch (err) {
      console.error("Failed to load states", err);
    } finally {
      setLoadingGeos(false);
    }
  };

  // When selectedState changes, load corresponding districts
  useEffect(() => {
    if (!selectedState) {
      setAvailableDistricts([]);
      setSelectedDistrict("");
      setEligibleLeaders([]);
      setSelectedLeaderId("");
      return;
    }

    const fetchDistricts = async () => {
      try {
        const res = await fetch(`/api/admin/geographic-options?state=${encodeURIComponent(selectedState)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableDistricts(data.districts || []);
        }
      } catch (err) {
        console.error("Failed to load districts", err);
      }
    };

    fetchDistricts();
    setSelectedDistrict("");
    setEligibleLeaders([]);
    setSelectedLeaderId("");
  }, [selectedState]);

  // Automatic Leader Discovery: Triggers immediately when BOTH State and District are selected!
  useEffect(() => {
    if (selectedState && selectedDistrict) {
      discoverLeaders(selectedState, selectedDistrict);
    } else {
      setEligibleLeaders([]);
      setSelectedLeaderId("");
    }
  }, [selectedState, selectedDistrict]);

  const discoverLeaders = async (state: string, district: string) => {
    setLoadingLeaders(true);
    try {
      const res = await fetch(
        `/api/meetings/eligible-leaders?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`
      );
      if (res.ok) {
        const data = await res.json();
        setEligibleLeaders(data.leaders || []);
        if (data.leaders?.length === 1) {
          setSelectedLeaderId(data.leaders[0].id);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to discover eligible leaders");
        setEligibleLeaders([]);
      }
    } catch {
      toast.error("Network error discovering leaders");
      setEligibleLeaders([]);
    } finally {
      setLoadingLeaders(false);
    }
  };

  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch meetings", err);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const handleCreateAndAssignMeeting = async () => {
    if (!meetingDate || !organizerName.trim() || !selectedState || !selectedDistrict || !selectedLeaderId) {
      toast.error("Please fill in all required meeting fields and select an eligible leader.");
      return;
    }

    setSubmittingAssignment(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDate,
          organizerName: organizerName.trim(),
          state: selectedState,
          district: selectedDistrict,
          leaderId: selectedLeaderId,
          remarks: assignmentRemarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Meeting created and assigned successfully!");
        // Reset form
        setMeetingDate("");
        setOrganizerName("");
        setSelectedState("");
        setSelectedDistrict("");
        setSelectedLeaderId("");
        setAssignmentRemarks("");
        setShowConfirmModal(false);
        // Refresh list
        fetchMeetings();
        setActiveTab("assignments");
      } else {
        toast.error(data.error || "Failed to create meeting");
      }
    } catch {
      toast.error("Network error while creating meeting");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const selectedLeader = eligibleLeaders.find((l) => l.id === selectedLeaderId);

  // Filtered leaders
  const filteredLeaders = eligibleLeaders.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(leaderSearch.toLowerCase()) ||
      l.username.toLowerCase().includes(leaderSearch.toLowerCase()) ||
      (l.district && l.district.toLowerCase().includes(leaderSearch.toLowerCase()));
    const matchesRole = leaderRoleFilter === "ALL" || l.role === leaderRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered meetings list
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      !listSearch ||
      m.referenceId.toLowerCase().includes(listSearch.toLowerCase()) ||
      m.organizerName.toLowerCase().includes(listSearch.toLowerCase()) ||
      m.district.toLowerCase().includes(listSearch.toLowerCase());

    const matchesState = !listStateFilter || m.state.toLowerCase() === listStateFilter.toLowerCase();
    const matchesDistrict = !listDistrictFilter || m.district.toLowerCase() === listDistrictFilter.toLowerCase();
    const matchesStatus = !listStatusFilter || m.status === listStatusFilter;

    return matchesSearch && matchesState && matchesDistrict && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED_TO_LEADER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "SELF_HANDLED_BY_LEADER":
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
      case "FORWARDED_TO_COORDINATOR":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "IN_PROGRESS":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn text-left pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Calendar className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Meeting Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Admin-controlled meeting creation, automatic regional leader discovery, and end-to-end assignment workflow.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shrink-0">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "create"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Meeting
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "assignments"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Assignments & Overview
            </button>
          </div>
        </div>

        {/* TAB 1: CREATE MEETING */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Step 1 of 2</span>
                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider mt-0.5">
                  Meeting Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Specify meeting date, organizer, and target territory to discover eligible regional leaders.
                </p>
              </div>

              {/* Required Field 1: Meeting Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Meeting Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Standard application calendar date</p>
              </div>

              {/* Required Field 2: Name (Organizer) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="e.g. John / Pastor David"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Name of the person arranging or organizing the meeting (Convener).
                </p>
              </div>

              {/* Required Field 3: State */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  State *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Select State --</option>
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Required Field 4: District */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  District *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedState}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedState ? "-- Select State First --" : "-- Select District --"}
                    </option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Districts dynamically depend on the selected State.
                </p>
              </div>

              {/* Optional Assignment Remarks */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Assignment Instructions / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={assignmentRemarks}
                  onChange={(e) => setAssignmentRemarks(e.target.value)}
                  placeholder="e.g. High priority meeting. Please coordinate dates and venue urgently."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Selection Summary Pill */}
              {selectedLeader && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    Selected Assignee
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-800 dark:text-white text-sm">{selectedLeader.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">@{selectedLeader.username}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                      {formatRoleBadge(selectedLeader.role)}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (!meetingDate || !organizerName.trim() || !selectedState || !selectedDistrict || !selectedLeaderId) {
                    toast.error("Please complete the form and select an eligible leader.");
                    return;
                  }
                  setShowConfirmModal(true);
                }}
                disabled={!selectedLeaderId || submittingAssignment}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  selectedLeaderId && !submittingAssignment
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-[0.98]"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Assign Meeting
              </button>
            </div>

            {/* Right Column: Dynamic Leader Discovery */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Step 2 of 2</span>
                  <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider mt-0.5">
                    Automatic Leader Discovery
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedState && selectedDistrict
                      ? `Eligible leaders serving ${selectedDistrict}, ${selectedState}:`
                      : "Select a State and District to automatically discover eligible regional leaders."}
                  </p>
                </div>

                {eligibleLeaders.length > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0 self-start sm:self-center">
                    {eligibleLeaders.length} Eligible Found
                  </span>
                )}
              </div>

              {/* State & District missing prompt */}
              {(!selectedState || !selectedDistrict) && (
                <div className="py-16 px-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Awaiting Geographic Selection
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Once you select both a <strong>State</strong> and <strong>District</strong> in the form, the system will automatically query and display all active, eligible State Leaders, Zonal Leaders, and Coordinators.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {selectedState && selectedDistrict && loadingLeaders && (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-2xl border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider animate-pulse">
                    Discovering leaders in {selectedDistrict}, {selectedState}...
                  </p>
                </div>
              )}

              {/* Leader List */}
              {selectedState && selectedDistrict && !loadingLeaders && (
                <>
                  {eligibleLeaders.length === 0 ? (
                    <div className="py-14 px-6 text-center rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        No Eligible Leaders Found
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        No active leaders are currently assigned to {selectedDistrict}, {selectedState}. You can add or reassign a leader from User Management.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search & Role Filters */}
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative flex-1 w-full">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter leaders by name or username..."
                            value={leaderSearch}
                            onChange={(e) => setLeaderSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <select
                          value={leaderRoleFilter}
                          onChange={(e) => setLeaderRoleFilter(e.target.value)}
                          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Roles</option>
                          <option value="STATE_LEADER">State Leaders</option>
                          <option value="ZONE_LEADER">Zonal Leaders</option>
                          <option value="COORDINATOR">Coordinators</option>
                        </select>
                      </div>

                      {/* Leaders Cards */}
                      <div className="space-y-2.5 max-h-115 overflow-y-auto pr-1">
                        {filteredLeaders.map((leader) => {
                          const isSelected = selectedLeaderId === leader.id;
                          return (
                            <div
                              key={leader.id}
                              onClick={() => setSelectedLeaderId(leader.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 dark:ring-indigo-500/40"
                                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform ${
                                  isSelected
                                    ? "bg-indigo-600 text-white scale-105"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}>
                                  {leader.name[0]?.toUpperCase() || "L"}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                      {leader.name}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                      leader.role === "STATE_LEADER"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : leader.role === "ZONE_LEADER"
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    }`}>
                                      {formatRoleBadge(leader.role)}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    @{leader.username} &bull; {leader.district || leader.state || "Territory"}
                                  </p>

                                  {leader.phoneNumber && (
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                      <Phone className="h-3 w-3 text-slate-400" />
                                      {leader.phoneNumber}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  leader.activeMeetingsCount === 0
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}>
                                  {leader.availabilityStatus}
                                </span>

                                <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : "border-slate-300 dark:border-slate-700"
                                }`}>
                                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2 & 3: ASSIGNMENTS & ALL MEETINGS OVERVIEW */}
        {activeTab !== "create" && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{stats.total}</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Assigned</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1 block">{stats.assignedToLeaders}</span>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Self-Handled</span>
                  <span className="text-xl font-black text-foreground mt-1 block">{stats.selfHandled}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Forwarded</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 block">{stats.forwardedToCoordinators}</span>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">In Progress</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1 block">{stats.inProgress}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Completed</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">{stats.completed}</span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">Cancelled</span>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1 block">{stats.cancelled}</span>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, name, district..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <select
                value={listStateFilter}
                onChange={(e) => setListStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">All States</option>
                {availableStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ASSIGNED_TO_LEADER">Assigned to Leader</option>
                <option value="SELF_HANDLED_BY_LEADER">Self-Handled</option>
                <option value="FORWARDED_TO_COORDINATOR">Forwarded to Coordinator</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                onClick={() => {
                  setListSearch("");
                  setListStateFilter("");
                  setListDistrictFilter("");
                  setListStatusFilter("");
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            {/* Meetings Table */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              {meetingsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-400">Loading meeting assignments...</span>
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No meeting records match your search criteria.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View (< 768px) */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMeetings.map((m) => (
                      <div key={m.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800">
                            {m.referenceId}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadge(m.status)}`}>
                            {m.status?.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {m.organizerName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(m.meetingDate).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} &bull; {m.district}, {m.state}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assignee</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {m.currentAssignee?.name || "Unassigned"}
                            </span>
                            <span className="text-[9px] text-indigo-500 font-bold uppercase block">
                              {formatRoleBadge(m.currentAssigneeRole || m.currentAssignee?.role)}
                            </span>
                          </div>

                          <button
                            onClick={() => setSelectedMeetingForHistory(m)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-10"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span>History</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / Tablet Table View (>= 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                          <th className="px-6 py-4">Reference ID</th>
                          <th className="px-6 py-4">Person Arranging (Name)</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Territory</th>
                          <th className="px-6 py-4">Current Assignee</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {filteredMeetings.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {m.referenceId}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              {m.organizerName}
                            </td>
                            <td className="px-6 py-4">
                              {new Date(m.meetingDate).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {m.district}, {m.state}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    {m.currentAssignee?.name || "Unassigned"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                                    {formatRoleBadge(m.currentAssigneeRole || m.currentAssignee?.role)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(m.status)}`}>
                                {m.status?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedMeetingForHistory(m)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                <History className="h-3.5 w-3.5" />
                                History
                              </button>
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
        )}

        {/* Confirmation Modal before Final Assignment */}
        {showConfirmModal && selectedLeader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4 text-left animate-modal">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Confirm Meeting Assignment
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Meeting Date:</span>
                  <span className="font-bold text-white">{meetingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Organizer (Name):</span>
                  <span className="font-bold text-white">{organizerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Territory:</span>
                  <span className="font-bold text-white">{selectedDistrict}, {selectedState}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-indigo-300 font-bold">Assignee:</span>
                  <span className="font-black text-indigo-400">{selectedLeader.name} ({formatRoleName(selectedLeader.role)})</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                The meeting and assignment records will be created atomically. The assigned leader will be notified immediately and will decide whether to handle it personally or forward to a local coordinator.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndAssignMeeting}
                  disabled={submittingAssignment}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {submittingAssignment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm & Assign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Assignment History Modal */}
        {selectedMeetingForHistory && (
          <MeetingAssignmentHistoryModal
            meeting={selectedMeetingForHistory}
            onClose={() => setSelectedMeetingForHistory(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
