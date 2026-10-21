"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileText, CalendarCheck, Plus, Bell, Eye, Pencil, X, Loader2, Trash2, BarChart3
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";
import { MonthlySummary } from "@/components/monthly-summary";

export default function CoordinatorDashboardPage() {
  const { user, language } = useUIStore();
  const router = useRouter();
  const [username, setUsername] = useState("Coordinator");
  const [dashboardTab, setDashboardTab] = useState<"reports" | "analytics">("reports");
  
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
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Welcome Header */}
        <div className="relative rounded-3xl p-5 sm:p-8 md:p-10 text-white overflow-hidden text-left" style={{ background: "var(--gradient-hero)" }}>
          <div className="absolute inset-0 dot-pattern opacity-20" />
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
              {translate("Welcome", language)}, {username}!
            </h2>
            <p className="mt-3 text-xs md:text-sm text-indigo-200/60 max-w-xl font-semibold leading-relaxed">
              Centralized portal to record details, attendance, and assess outcomes for WCM outreach meetings.
            </p>
          </div>
        </div>

        {/* Modules Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
          {/* Card 1: Create Meeting Report */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between group">
            <div>
              <div className="inline-flex rounded-2xl p-3.5 text-white border border-indigo-400/10" style={{ background: "var(--gradient-accent)" }}>
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-black text-foreground uppercase tracking-wider">
                Outreach Meeting Reports
              </h3>
              <p className="mt-2 text-sm text-foreground/50 font-medium leading-relaxed">
                Create a unified Meeting Report comprising the Verification, Attendance, and After Meeting sheets. Save drafts anytime and submit when complete.
              </p>
            </div>
            <button
              onClick={handleCreateReport}
              disabled={creatingReport}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 w-fit cursor-pointer disabled:opacity-50 active:scale-[0.97] btn-primary"
            >
              {creatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create New Report
            </button>
          </div>

          {/* Card 2: Upcoming Confirmations */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between group">
            <div>
              <div className="inline-flex rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 p-3.5 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-black text-foreground uppercase tracking-wider">
                Meeting Confirmations
              </h3>
              <p className="mt-2 text-sm text-foreground/50 font-medium leading-relaxed">
                Propose upcoming outreach meeting dates and locations to admin. Track approval and view feedback.
              </p>
            </div>
            <button
              onClick={() => router.push("/coordinator/confirmations")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-accent-foreground border border-border/50 hover:border-primary/20 transition-all duration-200 w-fit cursor-pointer active:scale-[0.97]"
            >
              Manage Confirmations
            </button>
          </div>
        </div>

        {/* Announcements Panel */}
        <div className="glass-card rounded-2xl text-left p-4 sm:p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 border-b border-border/30 pb-3 mb-4">
            <Bell className="h-4.5 w-4.5 text-primary" />
            Admin Announcements
          </h3>

          {notifsLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Loading announcements...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">
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
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-mono">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section View Switcher */}
        <div className="flex border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl gap-2 w-fit shadow-xs">
          <button
            type="button"
            onClick={() => setDashboardTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              dashboardTab === "reports"
                ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs font-black border border-slate-200 dark:border-indigo-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            My Meeting Reports
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              dashboardTab === "analytics"
                ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs font-black border border-slate-200 dark:border-indigo-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Monthly Summary & Charts
          </button>
        </div>

        {/* Tab 1: Meeting Reports Table */}
        {dashboardTab === "reports" && (
          <div className="glass-card rounded-2xl text-left p-4 sm:p-6 animate-fadeIn">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 border-b border-border/30 pb-3 mb-4">
              <FileText className="h-4.5 w-4.5 text-primary" />
              My Meeting Reports
            </h3>

          {reportsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">
              No reports created yet. Click "Create New Report" to start a draft.
            </div>
          ) : (
            <>
              {/* Mobile Cards (Phone View: < md) */}
              <div className="md:hidden space-y-3">
                {reports.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-300">
                            {r.reportId}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {r.title || `Outreach Meeting ${r.reportId}`}
                        </h4>
                      </div>
                    </div>

                    {/* 3 Form Statuses */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Verification</span>
                        <FormStatusBadge status={r.verificationStatus} size="sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Attendance</span>
                        <FormStatusBadge status={r.attendanceStatus} isLocked={r.isAttendanceLocked} size="sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Evaluation</span>
                        <FormStatusBadge status={r.evaluationStatus} isLocked={r.isEvaluationLocked} size="sm" />
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-indigo-200/70">
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
                      {r.rawStatus === "DRAFT" && (
                        <button
                          onClick={() => handleDeleteReport(r.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/coordinator/report/${r.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm"
                      >
                        <Pencil className="h-4 w-4" />
                        Manage Forms
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/15 bg-white/10 text-[11px] font-black text-slate-200 uppercase tracking-wider text-left">
                      <th className="px-5 py-3.5">Meeting Details</th>
                      <th className="px-5 py-3.5">Dates & Venue</th>
                      <th className="px-4 py-3.5 text-center">1. Verification</th>
                      <th className="px-4 py-3.5 text-center">2. Attendance</th>
                      <th className="px-4 py-3.5 text-center">3. Evaluation</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reports.map((r: any) => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-black text-indigo-300">{r.reportId}</div>
                          <div className="text-xs font-bold text-white mt-0.5">{r.title || `Outreach Meeting ${r.reportId}`}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-white">{r.meetingDates || "N/A"}</div>
                          <div className="text-[11px] text-indigo-200/50 mt-0.5 truncate max-w-48">{r.location || "N/A"}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormStatusBadge status={r.verificationStatus} size="sm" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormStatusBadge status={r.attendanceStatus} isLocked={r.isAttendanceLocked} size="sm" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormStatusBadge status={r.evaluationStatus} isLocked={r.isEvaluationLocked} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.rawStatus === "DRAFT" && (
                              <button
                                onClick={() => handleDeleteReport(r.id)}
                                className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 cursor-pointer"
                                title="Delete Meeting"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/coordinator/report/${r.id}`)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer shadow-sm"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Manage Forms
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

        {/* Tab 2: Monthly Summary & Charts */}
        {dashboardTab === "analytics" && (
          <div className="glass-card rounded-2xl text-left p-4 sm:p-6 animate-fadeIn">
            <MonthlySummary role="COORDINATOR" user={user} language={language} />
          </div>
        )}
      </div>

      {/* Modal: View Details */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col text-left animate-modal my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {detailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Loading details...</span>
                </div>
              ) : reportDetail ? (() => {
                const v = reportDetail.verificationSheet || reportDetail.verification;
                const a = reportDetail.attendanceRecord || reportDetail.attendance;
                const r = reportDetail.afterMeetingReport || reportDetail.report;

                return (
                <div className="space-y-8">
                  {/* Verification */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      1. Verification Sheet — All Details
                    </h4>
                    {v ? (
                      <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 font-semibold border border-slate-200/50 dark:border-slate-800/40 text-xs">
                        {/* Basic & Meeting */}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">Basic & Meeting Details</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Convener Name</span><span className="text-slate-800 dark:text-white font-bold">{v.convenerName || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Church Ministry</span><span className="text-slate-800 dark:text-white font-bold">{v.churchMinistryName || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Location</span><span className="text-slate-700 dark:text-slate-300">{v.stateDistrictCity || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Contact</span><span className="text-slate-700 dark:text-slate-300">{v.contactNumber || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Dates / Days</span><span className="text-slate-700 dark:text-slate-300">{v.meetingDates || "N/A"} ({v.numberOfDays || 0} days)</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Expected Attendance</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{v.expectedAttendance || 0} people</span></div>
                          </div>
                        </div>

                        {/* Ministry Background */}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">Ministry Background</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Years of Ministry</span><span className="text-slate-800 dark:text-white font-bold">{v.yearsOfMinistry || 0} Years</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Church Members</span><span className="text-slate-800 dark:text-white font-bold">{v.churchMembers || 0}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Workers & Leaders</span><span className="text-slate-800 dark:text-white font-bold">{v.workersLeaders || 0}</span></div>
                          </div>
                        </div>

                        {/* WCM Connection */}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">WCM Connection</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Know About WCM</span><span className="text-slate-700 dark:text-slate-300">{v.knowAboutWcm || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Read WCM Books?</span><span className="font-bold text-slate-800 dark:text-white">{v.readWcmBooks ? "Yes" : "No"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Attended Prophet Kiran Meeting?</span><span className="font-bold text-slate-800 dark:text-white">{v.attendedProphetMeeting ? "Yes" : "No"}</span></div>
                          </div>
                        </div>

                        {/* Arrangements */}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">Arrangements</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Hall & Stage</span><span className="text-slate-700 dark:text-slate-300">{v.meetingHallStage || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Sound System</span><span className="text-slate-700 dark:text-slate-300">{v.soundSystem || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Accommodation</span><span className="text-slate-700 dark:text-slate-300">{v.accommodationTeam || "N/A"}</span></div>
                            <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Volunteer Support</span><span className="text-slate-700 dark:text-slate-300">{v.volunteerSupport || "N/A"}</span></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No verification sheet entered.</p>
                    )}
                  </div>

                  {/* Attendance */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      2. Attendance Record — All Details
                    </h4>
                    {a ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 font-semibold border border-slate-200/50 dark:border-slate-800/40">
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Meeting Date</span><span className="text-slate-800 dark:text-white font-bold">{new Date(a.date).toLocaleDateString()}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Location</span><span className="text-slate-800 dark:text-white font-bold">{a.location || "N/A"}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Field Executer</span><span className="text-slate-700 dark:text-slate-300">{a.fieldExecuter || "N/A"}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Coordinator</span><span className="text-slate-700 dark:text-slate-300">{a.coordinator || "N/A"}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Members Attended</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{a.membersAttended || 0}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Pastors Attended</span><span className="text-indigo-600 dark:text-indigo-400 font-bold">{a.pastorsAttended || 0}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Total Attended</span><span className="text-slate-900 dark:text-white font-black text-sm">{(a.membersAttended || 0) + (a.pastorsAttended || 0)}</span></div>
                        <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Remarks</span><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{a.remarks || "None"}</p></div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No attendance record entered.</p>
                    )}
                  </div>

                  {/* After Meeting */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      3. After-Meeting Evaluation — All Details
                    </h4>
                    {r ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 font-semibold border border-slate-200/50 dark:border-slate-800/40">
                        <div className="sm:col-span-2"><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Overall Outcome</span><p className="text-slate-800 dark:text-white font-bold">{r.overallMeetingOutcome || "N/A"}</p></div>
                        <div className="sm:col-span-2"><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Congregation Response</span><p className="text-slate-700 dark:text-slate-300">{r.congregationResponse || "N/A"}</p></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Continue Fellowship?</span><span className="font-bold text-slate-800 dark:text-white">{r.continueFellowship ? "Yes" : "No"}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Following WCM Members</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{r.followingWcmMembersCount || 0}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Local Church Influence</span><span className="text-slate-700 dark:text-slate-300">{r.localChurchInfluence || "N/A"}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Network of Pastors</span><span className="text-slate-700 dark:text-slate-300">{r.networkOfPastors || "N/A"}</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Strengths</span><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.strengthsObserved || "None"}</p></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Challenges</span><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.challengesObserved || "None"}</p></div>
                        <div className="sm:col-span-2"><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Opportunity for WCM</span><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.opportunityForWcm || "None"}</p></div>
                        <div className="sm:col-span-2"><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Future Opportunities</span><p className="text-slate-700 dark:text-slate-300">{r.futureOpportunities?.join(", ") || "None"}</p></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Coordinator</span><span className="text-slate-800 dark:text-white font-bold">{r.coordinatorName || "N/A"} ({r.designation || "N/A"})</span></div>
                        <div><span className="text-slate-400 dark:text-slate-500 uppercase block font-black text-[9px] tracking-wider mb-0.5">Signature</span><span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.signature || "N/A"}</span></div>
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
                        <div key={log.id} className="text-xs font-semibold text-slate-500 flex justify-between gap-4 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/40">
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
                );
              })() : null}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setSelectedReportId(null);
                  setReportDetail(null);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
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
