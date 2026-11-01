"use client";

import React, { useEffect, useState } from "react";
import { 
  Building2, PhoneCall, CheckCircle2, Clock, 
  Lock, RefreshCw, AlertCircle, ChevronDown, ChevronRight,
  TrendingUp, Users, ArrowUpRight, ShieldCheck, MapPin
} from "lucide-react";
import { useRouter } from "next/navigation";

interface StateWorkloadOverviewProps {
  onSelectGeographicScope?: (state: string, zone?: string, district?: string) => void;
  className?: string;
}

export function StateWorkloadOverview({
  onSelectGeographicScope,
  className = "",
}: StateWorkloadOverviewProps) {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  const fetchWorkload = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/workload");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load workload analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

  const toggleExpand = (stateName: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [stateName]: !prev[stateName],
    }));
  };

  if (loading) {
    return (
      <div className={`p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${className}`}>
        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <span className="text-xs font-bold uppercase tracking-wider">Aggregating State Workloads & Calling Records...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.summary) {
    return null;
  }

  const { summary, stateBreakdown } = data;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. National Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Forms</span>
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{summary.totalForms}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Across all regions</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Forms</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300">{summary.pendingForms}</div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-semibold mt-0.5">Awaiting stages</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Calls</span>
            <PhoneCall className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300">{summary.pendingCalls}</div>
          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-semibold mt-0.5">Ready for AI dispatch</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">In Progress</span>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          </div>
          <div className="text-xl font-black text-purple-700 dark:text-purple-300">{summary.callsInProgress}</div>
          <div className="text-[10px] text-purple-600/80 dark:text-purple-400/80 font-semibold mt-0.5">Active or dialing</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Answered Lock</span>
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{summary.answeredLocked}</div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold mt-0.5">Permanently locked</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Retry Available</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{summary.retryEligible}</div>
          <div className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-semibold mt-0.5">No-answer / Busy</div>
        </div>
      </div>

      {/* 2. State-Wise Workload Table & Drill-Down */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              State-wise Workload & Calling Analytics
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time aggregation of pending forms, calls in progress, retry-eligible verifications, and locked answered calls.
            </p>
          </div>
          <button
            onClick={fetchWorkload}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">State / Hierarchy Scope</th>
                <th className="px-3 py-3 text-center">Total Forms</th>
                <th className="px-3 py-3 text-center">Pending Forms</th>
                <th className="px-3 py-3 text-center">Pending Calls</th>
                <th className="px-3 py-3 text-center">In Progress</th>
                <th className="px-3 py-3 text-center">Completed Calls</th>
                <th className="px-3 py-3 text-center">No-Answer</th>
                <th className="px-3 py-3 text-center">Retry Available</th>
                <th className="px-3 py-3 text-center">Answered & Locked</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {stateBreakdown.map((stateItem: any) => {
                const isExpanded = Boolean(expandedStates[stateItem.state]);

                return (
                  <React.Fragment key={stateItem.state}>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors font-medium">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(stateItem.state)}
                          className="flex items-center gap-2 font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          <span className="text-xs">{stateItem.state}</span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            {stateItem.zones?.length || 0} Zone(s)
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center font-bold">{stateItem.totalForms}</td>
                      <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {stateItem.pendingForms}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {stateItem.pendingCalls}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-purple-600 dark:text-purple-400">
                        {stateItem.callsInProgress}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-white">
                        {stateItem.completedCalls}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                        {stateItem.noAnswerCalls}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {stateItem.retryEligible}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <Lock className="h-2.5 w-2.5" />
                          {stateItem.answeredLocked}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (onSelectGeographicScope) {
                                onSelectGeographicScope(stateItem.state);
                              } else {
                                router.push(`/admin/calling-center?state=${encodeURIComponent(stateItem.state)}`);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Calling Center
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Zone & District Drilldown */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="p-0 bg-slate-50/50 dark:bg-slate-950/50">
                          <div className="p-3 pl-8 space-y-2 border-y border-slate-100 dark:border-slate-800">
                            {stateItem.zones?.map((zoneItem: any) => (
                              <div
                                key={zoneItem.zone}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                      {zoneItem.zone} Zone
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ({zoneItem.totalForms} Forms, {zoneItem.pendingCalls} Calls Pending)
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (onSelectGeographicScope) {
                                        onSelectGeographicScope(stateItem.state, zoneItem.zone);
                                      } else {
                                        router.push(
                                          `/admin/calling-center?state=${encodeURIComponent(
                                            stateItem.state
                                          )}&zone=${encodeURIComponent(zoneItem.zone)}`
                                        );
                                      }
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    View Zone in Calling Center →
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {zoneItem.districts?.map((d: any) => (
                                    <div
                                      key={d.district}
                                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]"
                                    >
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {d.district}
                                      </span>
                                      <div className="flex items-center gap-1.5 font-bold">
                                        <span className="text-amber-600 dark:text-amber-400" title="Pending forms">
                                          {d.pendingForms}P
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="text-emerald-600 dark:text-emerald-400" title="Answered & Locked">
                                          {d.answeredLocked}L
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
