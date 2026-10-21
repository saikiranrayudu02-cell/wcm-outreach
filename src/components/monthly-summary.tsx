"use client";

import React, { useEffect, useState, useMemo } from "react";
import { translate } from "@/lib/translations";
import { 
  FileText, Users, Calendar, AlertCircle, Search, Filter, 
  ChevronDown, ChevronUp, Eye, ArrowUpRight, BarChart3, PieChart,
  UserCheck, Sparkles, Building2, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { MeetingReviewModal } from "@/components/meeting-review-modal";
import { FormStatusBadge } from "@/components/form-status-badge";

interface MonthlySummaryProps {
  role: "STATE_LEADER" | "ZONE_LEADER" | "ADMIN" | "COORDINATOR";
  user: any;
  language: "en" | "hi" | "te";
}

export function MonthlySummary({ role, user, language }: MonthlySummaryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [viewScope, setViewScope] = useState<"month" | "year">("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Review modal state
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/monthly-summary?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error();
      const summaryData = await res.json();
      setData(summaryData);
    } catch (err) {
      toast.error("Failed to load monthly summary statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedMonth, selectedYear]);

  const summary = data?.summary || { 
    totalMeetings: 0, 
    totalMembersAttended: 0, 
    totalPastorsAttended: 0,
    totalHeadcount: 0, 
    totalWcmFollowers: 0,
    avgAttendance: 0,
    interestedFellowshipCount: 0
  };

  const pieChartData = data?.pieChartData || [];
  const barChartData = data?.barChartData || [];
  const monthMeetings = data?.meetings || [];
  const allYearMeetings = data?.allYearMeetings || [];

  // Active table meetings based on scope
  const rawList = viewScope === "month" ? monthMeetings : allYearMeetings;

  const filteredMeetings = useMemo(() => {
    if (!searchTerm.trim()) return rawList;
    const q = searchTerm.toLowerCase();
    return rawList.filter((m: any) => 
      m.reportId?.toLowerCase().includes(q) ||
      m.churchMinistryName?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q) ||
      m.coordinator?.toLowerCase().includes(q) ||
      m.fieldExecuter?.toLowerCase().includes(q) ||
      m.overallMeetingOutcome?.toLowerCase().includes(q)
    );
  }, [rawList, searchTerm]);

  // Colors for Pie Chart slices
  const sliceColors = [
    "stroke-sky-500 text-sky-500",
    "stroke-indigo-500 text-indigo-500",
    "stroke-purple-500 text-purple-500",
    "stroke-emerald-500 text-emerald-500",
    "stroke-amber-500 text-amber-500",
    "stroke-rose-500 text-rose-500",
  ];
  const bgColors = [
    "bg-sky-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
  ];

  // Circle circumference
  const circ = 251.32;
  let cumulativePercentage = 0;

  // Maximum values for bar chart scaling
  const maxMeetings = Math.max(...barChartData.map((d: any) => d.meetings), 1);
  const maxAttendees = Math.max(...barChartData.map((d: any) => d.attendees), 1);

  const getSelectedMonthName = () => {
    return months.find((m) => m.value === selectedMonth)?.label || "";
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      {/* Filters & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {translate("Select Month", language)}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {translate("Select Year", language)}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewScope("month")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewScope === "month"
                  ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewScope("year")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewScope === "year"
                  ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Full Year ({selectedYear})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          {role === "STATE_LEADER" && (
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              State: <strong className="text-white">{user?.state || "All"}</strong>
            </span>
          )}
          {role === "ZONE_LEADER" && (
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              Zone: <strong className="text-white">{user?.zone || "All"}</strong>
            </span>
          )}
          {role === "ADMIN" && (
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]">
              All Regions (Admin View)
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-xs font-bold uppercase tracking-wider">Compiling monthly summary metrics...</span>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Meetings */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center gap-4">
              <div className="rounded-xl bg-sky-500/10 text-sky-500 p-3.5 border border-sky-500/20 shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Total Meetings
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                  {summary.totalMeetings}
                </h3>
                <span className="text-[10px] text-slate-400">In {getSelectedMonthName()}</span>
              </div>
            </div>

            {/* Total Headcount (Members + Pastors) */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center gap-4">
              <div className="rounded-xl bg-emerald-500/10 text-emerald-500 p-3.5 border border-emerald-500/20 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Total Headcount
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                  {summary.totalHeadcount}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {summary.totalMembersAttended} Members • {summary.totalPastorsAttended} Pastors
                </span>
              </div>
            </div>

            {/* WCM Followers */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center gap-4">
              <div className="rounded-xl bg-purple-500/10 text-purple-500 p-3.5 border border-purple-500/20 shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  WCM Followers
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                  {summary.totalWcmFollowers}
                </h3>
                <span className="text-[10px] text-slate-400">Following WCM Ministry</span>
              </div>
            </div>

            {/* Average Headcount per Meeting */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center gap-4">
              <div className="rounded-xl bg-indigo-500/10 text-indigo-500 p-3.5 border border-indigo-500/20 shrink-0">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Avg Attendance
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                  {summary.avgAttendance}
                </h3>
                <span className="text-[10px] text-slate-400">Attendees / Meeting</span>
              </div>
            </div>
          </div>

          {/* Visual Charts: Location Coverage & Monthly Attendance Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Location / Area Coverage (Pie Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-indigo-500" />
                  Location / Area Coverage
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {getSelectedMonthName()}
                </span>
              </div>

              {pieChartData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  No attendance records recorded for this month.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* SVG Pie Chart */}
                  <div className="relative h-32 w-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {pieChartData.map((item: any, idx: number) => {
                        const strokeLength = (item.percentage / 100) * circ;
                        const strokeOffset = circ - ((cumulativePercentage / 100) * circ);
                        cumulativePercentage += item.percentage;

                        const colorClass = sliceColors[idx % sliceColors.length];

                        return (
                          <circle
                            key={item.name}
                            cx="50"
                            cy="50"
                            r="40"
                            className={`fill-transparent ${colorClass.split(" ")[0]} transition-all duration-500`}
                            strokeWidth="16"
                            strokeDasharray={`${strokeLength} ${circ}`}
                            strokeDashoffset={strokeOffset}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800 dark:text-white">
                        {summary.totalMeetings}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        Meetings
                      </span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="space-y-2 flex-1 min-w-30 max-h-48 overflow-y-auto pr-1">
                    {pieChartData.map((item: any, idx: number) => {
                      const colorBg = bgColors[idx % bgColors.length];
                      return (
                        <div key={item.name} className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`h-2.5 w-2.5 rounded-full ${colorBg} shrink-0`}></span>
                            <span className="truncate" title={item.name}>{item.name}</span>
                          </div>
                          <span className="font-bold shrink-0">{item.percentage}% ({item.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Trends (Bar Chart across 12 months) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-sky-500" />
                  Monthly Attendance & Meetings Trends ({selectedYear})
                </h4>

                <div className="flex gap-4 text-xs font-bold uppercase">
                  <span className="flex items-center gap-1.5 text-sky-500">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-500"></span>
                    Meetings
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-500">
                    <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500"></span>
                    Attendees
                  </span>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="overflow-x-auto pb-2 no-scrollbar">
                <div className="min-w-120 sm:min-w-0">
                  <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-52 pt-6 border-b border-slate-200 dark:border-slate-800 px-2">
                    {barChartData.map((d: any) => {
                      const meetHeight = (d.meetings / maxMeetings) * 100;
                      const attHeight = (d.attendees / maxAttendees) * 100;
                      const isCurrent = d.month === getSelectedMonthName().slice(0, 3);

                      return (
                        <div key={d.month} className="group relative flex flex-col items-center gap-1 h-full justify-end">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-800 text-white rounded-xl p-2.5 text-[10px] font-bold shadow-lg z-20 w-28 text-center pointer-events-none">
                            <p className="border-b border-slate-700 pb-1 mb-1 uppercase tracking-wider text-white">
                              {d.month} {selectedYear}
                            </p>
                            <p className="text-sky-300">Meetings: {d.meetings}</p>
                            <p className="text-indigo-300">Headcount: {d.attendees}</p>
                            <p className="text-purple-300">Followers: {d.followers || 0}</p>
                          </div>

                          {/* Dual Bars */}
                          <div className={`flex gap-1 items-end h-full w-full justify-center p-1 rounded-t-lg transition-colors ${
                            isCurrent ? "bg-indigo-500/10" : ""
                          }`}>
                            <div
                              style={{ height: `${Math.max(meetHeight, 4)}%` }}
                              className="w-1.5 sm:w-2.5 rounded-t bg-sky-500 hover:bg-sky-400 transition-all cursor-pointer"
                              title={`Meetings: ${d.meetings}`}
                            />
                            <div
                              style={{ height: `${Math.max(attHeight, 4)}%` }}
                              className="w-1.5 sm:w-2.5 rounded-t bg-indigo-500 hover:bg-indigo-400 transition-all cursor-pointer"
                              title={`Attendees: ${d.attendees}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Month Labels */}
                  <div className="grid grid-cols-12 gap-1.5 sm:gap-3 pt-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase text-center">
                    {barChartData.map((d: any) => {
                      const isCurrent = d.month === getSelectedMonthName().slice(0, 3);
                      return (
                        <span 
                          key={d.month} 
                          className={`truncate cursor-pointer hover:text-white transition-colors ${
                            isCurrent ? "text-indigo-400 font-black" : ""
                          }`}
                        >
                          {d.month}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* THE MONTHLY SUMMARY TABLE (Populated from Attendance & After Meeting) */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    Monthly Summary Table
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-xs">
                    {filteredMeetings.length} {filteredMeetings.length === 1 ? "Meeting" : "Meetings"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Auto-populated from submitted Attendance Records and After-Meeting Evaluation Forms for {viewScope === "month" ? `${getSelectedMonthName()} ${selectedYear}` : `All of ${selectedYear}`}.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search meeting, church, venue..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold uppercase tracking-wider">No meeting records found</p>
                <p className="text-xs text-slate-500 max-w-md">
                  No outreach meetings with submitted Attendance or After-Meeting forms were found for this period. Submitting attendance or evaluation forms will automatically populate this table and charts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">Meeting / Church</th>
                      <th className="px-4 py-3">Date & Venue</th>
                      <th className="px-4 py-3">Coordinator / Executer</th>
                      <th className="px-3 py-3 text-center">Members</th>
                      <th className="px-3 py-3 text-center">Pastors</th>
                      <th className="px-3 py-3 text-center">Total Headcount</th>
                      <th className="px-4 py-3">Outcome & Response</th>
                      <th className="px-3 py-3 text-center">WCM Followers</th>
                      <th className="px-3 py-3 text-center">Fellowship</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                    {filteredMeetings.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Meeting & Church */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-mono text-indigo-500 dark:text-indigo-400 font-black text-[11px]">
                              {m.reportId}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs mt-0.5">
                              {m.churchMinistryName || m.title}
                            </span>
                            {m.convenerName && m.convenerName !== "N/A" && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                Convener: {m.convenerName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date & Venue */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(m.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-slate-500 text-[11px] flex items-center gap-1 truncate max-w-48">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {m.location}
                            </span>
                          </div>
                        </td>

                        {/* Coordinator / Executer */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {m.coordinator}
                            </span>
                            {m.fieldExecuter && m.fieldExecuter !== "N/A" && (
                              <span className="text-slate-400 text-[10px]">
                                Field: {m.fieldExecuter}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Members Attended */}
                        <td className="px-3 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          {m.membersAttended}
                        </td>

                        {/* Pastors Attended */}
                        <td className="px-3 py-3.5 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {m.pastorsAttended}
                        </td>

                        {/* Total Headcount */}
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                            {m.totalAttended}
                          </span>
                        </td>

                        {/* Outcome & Response */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1 max-w-44">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                              m.overallMeetingOutcome === "Exceptional" 
                                ? "bg-emerald-500/20 text-emerald-300"
                                : m.overallMeetingOutcome === "Very Good"
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-slate-500/20 text-slate-300"
                            }`}>
                              {m.overallMeetingOutcome}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate" title={m.congregationResponse}>
                              {m.congregationResponse}
                            </span>
                          </div>
                        </td>

                        {/* WCM Followers */}
                        <td className="px-3 py-3.5 text-center font-black text-purple-600 dark:text-purple-400">
                          {m.followingWcmMembersCount}
                        </td>

                        {/* Continue Fellowship */}
                        <td className="px-3 py-3.5 text-center">
                          {m.continueFellowship === true ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
                              Yes
                            </span>
                          ) : m.continueFellowship === false ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-500/20 text-slate-400">
                              No
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMeetingId(m.id);
                              setShowReviewModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Form
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Meeting Review Modal to inspect all complete fields */}
      {showReviewModal && selectedMeetingId && (
        <MeetingReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedMeetingId(null);
          }}
          reportId={selectedMeetingId}
          role={role === "COORDINATOR" ? "ZONE_LEADER" : role}
          username={user?.username || "Viewer"}
          onUpdated={fetchSummaryData}
        />
      )}
    </div>
  );
}
