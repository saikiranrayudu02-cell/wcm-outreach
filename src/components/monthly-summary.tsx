"use client";

import React, { useEffect, useState } from "react";
import { translate } from "@/lib/translations";
import { FileText, Users, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MonthlySummaryProps {
  role: "STATE_LEADER" | "ZONE_LEADER" | "ADMIN";
  user: any;
  language: "en" | "hi" | "te";
}

export function MonthlySummary({ role, user, language }: MonthlySummaryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

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

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        <span className="text-sm font-bold uppercase tracking-wider">Generating summary...</span>
      </div>
    );
  }

  const summary = data?.summary || { totalMeetings: 0, totalMembersAttended: 0, totalWcmFollowers: 0 };
  const pieChartData = data?.pieChartData || [];
  const barChartData = data?.barChartData || [];

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

  // Circle circum = 2 * pi * r = 2 * 3.14159 * 40 = 251.32
  const circ = 251.32;
  let cumulativePercentage = 0;

  // Maximum values for bar chart scaling
  const maxMeetings = Math.max(...barChartData.map((d: any) => d.meetings), 1);
  const maxAttendees = Math.max(...barChartData.map((d: any) => d.attendees), 1);

  return (
    <div className="space-y-8 text-left">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">{translate("Select Month", language)}</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">{translate("Select Year", language)}</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-4 text-xs font-semibold text-slate-400 uppercase justify-between sm:justify-end">
          {role === "STATE_LEADER" && (
            <span>State: <strong className="text-slate-700 dark:text-slate-200">{user?.state || "N/A"}</strong></span>
          )}
          {role === "ZONE_LEADER" && (
            <span>Zone: <strong className="text-slate-700 dark:text-slate-200">{user?.zone || "N/A"}</strong></span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Total Meetings */}
            <div className="rounded-xl border border-sky-100 dark:border-sky-950 bg-linear-to-br from-white to-sky-50/20 dark:from-slate-900 dark:to-sky-950/10 p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
              <div className="rounded-xl bg-sky-50 dark:bg-sky-950 p-4 text-sky-600 dark:text-sky-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {translate("Total Meetings Conducted", language)}
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {summary.totalMeetings}
                </h3>
              </div>
            </div>

            {/* Total Attendees */}
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-950 bg-linear-to-br from-white to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/10 p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950 p-4 text-indigo-600 dark:text-indigo-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {translate("Total Members Attended", language)}
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {summary.totalMembersAttended}
                </h3>
              </div>
            </div>

            {/* Members Following WCM */}
            <div className="rounded-xl border border-purple-100 dark:border-purple-950 bg-linear-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/10 p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
              <div className="rounded-xl bg-purple-50 dark:bg-purple-950 p-4 text-purple-600 dark:text-purple-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {translate("Members Following WCM Ministry", language)}
                </p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {summary.totalWcmFollowers}
                </h3>
              </div>
            </div>
          </div>

          {summary.totalMeetings === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 font-semibold flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-10 w-10 text-slate-300" />
              {translate("No outreach meetings recorded for this month", language)}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Location/Area Coverage (Pie Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  {translate("Location/Area Meeting Coverage", language)}
                </h4>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* SVG Pie Chart */}
                  <div className="relative h-32 w-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {pieChartData.length === 0 ? (
                        <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="16" fill="transparent" />
                      ) : (
                        pieChartData.map((item: any, idx: number) => {
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
                        })
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800 dark:text-white">{summary.totalMeetings}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Meetings</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="space-y-2 flex-1 min-w-30">
                    {pieChartData.map((item: any, idx: number) => {
                      const colorBg = bgColors[idx % bgColors.length];
                      return (
                        <div key={item.name} className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`h-2.5 w-2.5 rounded-full ${colorBg} shrink-0`}></span>
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="font-bold shrink-0">{item.percentage}% ({item.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Monthly Attendance & Meetings (Bar Chart) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    {translate("Monthly Attendance & Meetings", language)}
                  </h4>

                  <div className="flex gap-4 text-xs font-bold uppercase">
                    <span className="flex items-center gap-1 text-sky-500">
                      <span className="h-2.5 w-2.5 rounded-sm bg-sky-500"></span>
                      Meetings
                    </span>
                    <span className="flex items-center gap-1 text-indigo-500">
                      <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500"></span>
                      Attendees
                    </span>
                  </div>
                </div>

                {/* HTML Bar Chart Grid with horizontal pan container for mobile screens */}
                <div className="overflow-x-auto pb-2 no-scrollbar">
                  <div className="min-w-120 sm:min-w-0">
                    <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-56 pt-6 border-b border-slate-200 dark:border-slate-800 px-2">
                      {barChartData.map((data: any) => {
                        const meetHeight = (data.meetings / maxMeetings) * 100;
                        const attHeight = (data.attendees / maxAttendees) * 100;

                        return (
                          <div key={data.month} className="group relative flex flex-col items-center gap-1 h-full justify-end">
                            {/* Hover Tooltip card */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-800 text-white rounded-lg p-2 text-[10px] font-bold shadow-lg z-20 w-24 text-center pointer-events-none transition-all">
                              <p className="border-b border-slate-700 pb-1 mb-1 uppercase tracking-wider">{data.month}</p>
                              <p className="text-sky-300">Meetings: {data.meetings}</p>
                              <p className="text-indigo-300">Attendees: {data.attendees}</p>
                            </div>

                            {/* Dual bars */}
                            <div className="flex gap-0.5 items-end h-full w-full justify-center">
                              <div
                                style={{ height: `${meetHeight}%` }}
                                className="w-1.5 sm:w-2.5 rounded-t bg-sky-500 hover:bg-sky-600 transition-all cursor-pointer min-h-1"
                              />
                              <div
                                style={{ height: `${attHeight}%` }}
                                className="w-1.5 sm:w-2.5 rounded-t bg-indigo-500 hover:bg-indigo-600 transition-all cursor-pointer min-h-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Month labels footer */}
                    <div className="grid grid-cols-12 gap-1.5 sm:gap-3 pt-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase text-center">
                      {barChartData.map((data: any) => (
                        <span key={data.month} className="truncate">
                          {data.month}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
