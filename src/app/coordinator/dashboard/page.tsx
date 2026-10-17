"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileText, CalendarCheck, Plus, Bell, Eye, Pencil, X, Loader2, Trash2
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";

export default function CoordinatorDashboardPage() {
  const { language } = useUIStore();
  const router = useRouter();
  const [username, setUsername] = useState("Coordinator");
  
  // Announcements
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);

  // Reports
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [creatingReport, setCreatingReport] = useState(false);

  // Details Modal
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setNotifsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setUsername(session.user.name || session.user.username || "Coordinator");
      }
    };
    fetchUser();
    fetchNotifications();
    fetchReports();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        toast.success("Message marked as read");
      }
    } catch (err) {
      toast.error("Failed to update message status");
    }
  };

  const handleCreateReport = async () => {
    setCreatingReport(true);
    try {
      const res = await fetch("/api/reports/create", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create report");
      const data = await res.json();
      toast.success("Report Draft Created");
      router.push(`/coordinator/report/${data.id}`);
    } catch (err) {
      toast.error("Failed to create a new report");
    } finally {
      setCreatingReport(false);
    }
  };

  const handleOpenReport = async (id: string) => {
    setSelectedReportId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReportDetail(data);
    } catch (err) {
      toast.error("Failed to load report details");
      setSelectedReportId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft report? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Draft report deleted successfully");
        fetchReports();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete report");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the report");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome Header */}
        <div className="rounded-3xl bg-linear-to-r from-blue-600 via-indigo-650 to-indigo-800 p-5 sm:p-8 md:p-10 text-white shadow-xl text-left border border-blue-500/10">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
            {translate("Welcome", language)}, {username}!
          </h2>
          <p className="mt-3 text-xs md:text-sm text-indigo-100 max-w-xl font-bold uppercase tracking-wider leading-relaxed">
            Centralized portal to record details, attendance, and assess outcomes for WCM outreach meetings.
          </p>
        </div>

        {/* Modules Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
          {/* Card 1: Create Meeting Report */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="inline-flex rounded-2xl bg-blue-50 dark:bg-blue-950/20 p-3.5 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Outreach Meeting Reports
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Create a unified Meeting Report comprising the Verification, Attendance, and After Meeting sheets. Save drafts anytime and submit when complete.
              </p>
            </div>
            <button
              onClick={handleCreateReport}
              disabled={creatingReport}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-150 w-fit cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {creatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create New Report
            </button>
          </div>

          {/* Card 2: Upcoming Confirmations */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="inline-flex rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-3.5 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Meeting Confirmations
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Propose upcoming outreach meeting dates and locations to admin. Track approval and view feedback.
              </p>
            </div>
            <button
              onClick={() => router.push("/coordinator/confirmations")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-250 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-150 w-fit cursor-pointer active:scale-[0.98]"
            >
              Manage Confirmations
            </button>
          </div>
        </div>

        {/* Announcements Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm text-left p-4 sm:p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <Bell className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            Admin Announcements
          </h3>

          {notifsLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Loading announcements...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider italic">
              No recent announcements.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.slice(0, 3).map((n) => (
                <div 
                  key={n.id} 
                  className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                    n.read 
                      ? "bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/50 opacity-80" 
                      : "bg-linear-to-br from-white to-blue-50/10 dark:from-slate-900 dark:to-blue-950/5 border-blue-100 dark:border-blue-950/50 shadow-sm border-l-4 border-l-blue-500"
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>}
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-650 dark:text-slate-350 font-medium leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-mono">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-450 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meeting Reports Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm text-left p-4 sm:p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <FileText className="h-4.5 w-4.5 text-blue-600" />
            My Meeting Reports
          </h3>

          {reportsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider italic">
              No reports created yet. Click "Create New Report" to start a draft.
            </div>
          ) : (
            <>
              {/* Mobile Cards (Phone View: < md) */}
              <div className="md:hidden space-y-3">
                {reports.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {r.reportId}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          Version: v{r.version}
                        </span>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                        r.rawStatus === "APPROVED"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30"
                          : r.rawStatus === "REJECTED"
                          ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/30"
                          : r.rawStatus === "DRAFT"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          : r.rawStatus === "REQUEST_CHANGES"
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-200/50 dark:border-amber-900/30"
                          : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border-blue-200/50 dark:border-blue-900/30"
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 border-y border-slate-200/60 dark:border-slate-800/60 py-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Dates:</span>
                        <span className="font-bold">{r.meetingDates || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Location:</span>
                        <span className="font-bold truncate max-w-50 text-right">{r.location || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {["DRAFT", "REQUEST_CHANGES"].includes(r.rawStatus) ? (
                        <>
                          {r.rawStatus === "DRAFT" && (
                            <button
                              onClick={() => handleDeleteReport(r.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors border border-red-500/10 cursor-pointer min-h-10 active:scale-[0.96]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/coordinator/report/${r.id}`)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors cursor-pointer min-h-10 shadow-xs active:scale-[0.96]"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Report
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenReport(r.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer min-h-10 active:scale-[0.96]"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 text-[10px] font-bold text-slate-450 uppercase tracking-widest text-left">
                      <th className="px-6 py-4">Report ID</th>
                      <th className="px-6 py-4">Dates / Location</th>
                      <th className="px-6 py-4 text-center">Version</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reports.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {r.reportId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-300">{r.meetingDates || "N/A"}</div>
                          <div className="text-[11px] text-slate-450 mt-0.5">{r.location || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-550 dark:text-slate-450">
                          v{r.version}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            r.rawStatus === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30"
                              : r.rawStatus === "REJECTED"
                              ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/30"
                              : r.rawStatus === "DRAFT"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              : r.rawStatus === "REQUEST_CHANGES"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-200/50 dark:border-amber-900/30"
                              : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border-blue-200/50 dark:border-blue-900/30"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {["DRAFT", "REQUEST_CHANGES"].includes(r.rawStatus) ? (
                            <>
                              <button
                                onClick={() => router.push(`/coordinator/report/${r.id}`)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-500/10 cursor-pointer active:scale-[0.96]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              {r.rawStatus === "DRAFT" && (
                                <button
                                  onClick={() => handleDeleteReport(r.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-bold text-red-655 dark:text-red-400 hover:bg-red-100 transition-colors border border-red-500/10 cursor-pointer active:scale-[0.96]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenReport(r.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer active:scale-[0.96]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
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

      {/* Modal: View Details */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col text-left animate-modal my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-wider">
                  Meeting Report Details ({reportDetail?.reportId})
                </h3>
                <span className="inline-flex rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1.5 border border-blue-500/10">
                  Status: {reportDetail?.status?.replace(/_/g, " ")} (v{reportDetail?.version})
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedReportId(null);
                  setReportDetail(null);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Loading details...</span>
                </div>
              ) : reportDetail ? (
                <div className="space-y-8">
                  {/* Verification */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">1. Verification Sheet</h4>
                    {reportDetail.verificationSheet ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 font-semibold border border-slate-200/50 dark:border-slate-800/40">
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Convener Name</span>{reportDetail.verificationSheet.convenerName}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Church Ministry</span>{reportDetail.verificationSheet.churchMinistryName}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Location</span>{reportDetail.verificationSheet.stateDistrictCity}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Contact</span>{reportDetail.verificationSheet.contactNumber}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Dates / Days</span>{reportDetail.verificationSheet.meetingDates} ({reportDetail.verificationSheet.numberOfDays} days)</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Expected Attendance</span>{reportDetail.verificationSheet.expectedAttendance}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No verification sheet entered.</p>
                    )}
                  </div>

                  {/* Attendance */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">2. Attendance Record</h4>
                    {reportDetail.attendanceRecord ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 font-semibold border border-slate-200/50 dark:border-slate-800/40">
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Meeting Date</span>{new Date(reportDetail.attendanceRecord.date).toLocaleDateString()}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Location</span>{reportDetail.attendanceRecord.location}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Field Executer</span>{reportDetail.attendanceRecord.fieldExecuter}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Members Attended</span>{reportDetail.attendanceRecord.membersAttended}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Pastors Attended</span>{reportDetail.attendanceRecord.pastorsAttended}</div>
                        <div className="sm:col-span-2"><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Remarks</span>{reportDetail.attendanceRecord.remarks}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No attendance record entered.</p>
                    )}
                  </div>

                  {/* After Meeting */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">3. After Meeting Report</h4>
                    {reportDetail.afterMeetingReport ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 font-semibold border border-slate-200/50 dark:border-slate-800/40">
                        <div className="sm:col-span-2"><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Outcome</span>{reportDetail.afterMeetingReport.overallMeetingOutcome}</div>
                        <div className="sm:col-span-2"><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Congregation Response</span>{reportDetail.afterMeetingReport.congregationResponse}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Strengths</span>{reportDetail.afterMeetingReport.strengthsObserved}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Challenges</span>{reportDetail.afterMeetingReport.challengesObserved}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Future Opportunities</span>{reportDetail.afterMeetingReport.futureOpportunities?.join(", ") || "None"}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">WCM Followers Count</span>{reportDetail.afterMeetingReport.followingWcmMembersCount}</div>
                        <div><span className="text-slate-450 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Signature</span>{reportDetail.afterMeetingReport.signature} ({reportDetail.afterMeetingReport.designation})</div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No after meeting report entered.</p>
                    )}
                  </div>

                  {/* Audit Trails */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Activity Log</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {reportDetail.auditLogs?.map((log: any) => (
                        <div key={log.id} className="text-xs font-semibold text-slate-500 flex justify-between gap-4 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-800/40">
                          <span>
                            <strong>{log.action}</strong>: {log.details}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono self-center">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-808 shrink-0">
              <button
                onClick={() => {
                  setSelectedReportId(null);
                  setReportDetail(null);
                }}
                className="rounded-xl border border-slate-250 dark:border-slate-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
