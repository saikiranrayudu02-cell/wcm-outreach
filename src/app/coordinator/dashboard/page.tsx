"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileText, CalendarCheck, Plus, Bell, Eye, Pencil, X, Loader2, Trash2, BarChart3, Inbox, Calendar as CalendarIcon
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";
import { FormTrackingTable } from "@/components/form-tracking-table";
import { MonthlySummary } from "@/components/monthly-summary";
import { CompletedVerificationsCalendar } from "@/components/completed-verifications-calendar";

export default function CoordinatorDashboardPage() {
  const { user, language } = useUIStore();
  const router = useRouter();
  const [username, setUsername] = useState("Coordinator");
  const [dashboardTab, setDashboardTab] = useState<"reports" | "calendar" | "analytics">("reports");
  
  // Announcements
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);

  // Reports
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [creatingReport, setCreatingReport] = useState(false);

  // Mapped verification records for Calendar View
  const calendarVerifications = React.useMemo(() => {
    return reports
      .filter((r) => r.verificationSheet)
      .map((r) => ({
        id: r.verificationSheet.id,
        meetingReportId: r.id,
        reportId: r.reportId,
        reportTitle: r.title,
        status: r.verificationSheet.status,
        convenerName: r.verificationSheet.convenerName,
        churchMinistryName: r.verificationSheet.churchMinistryName,
        stateDistrictCity: r.verificationSheet.stateDistrictCity,
        contactNumber: r.verificationSheet.contactNumber,
        formattedPhone: r.verificationSheet.contactNumber,
        meetingDates: r.verificationSheet.meetingDates,
        numberOfDays: r.verificationSheet.numberOfDays,
        expectedAttendance: r.verificationSheet.expectedAttendance,
        meetingSession: r.verificationSheet.meetingSession,
        travelMode: r.verificationSheet.travelMode,
        travelOtherDetails: r.verificationSheet.travelOtherDetails,
        stayLocation: r.verificationSheet.stayLocation,
        yearsOfMinistry: r.verificationSheet.yearsOfMinistry,
        churchMembers: r.verificationSheet.churchMembers,
        workersLeaders: r.verificationSheet.workersLeaders,
        meetingHallStage: r.verificationSheet.meetingHallStage,
        soundSystem: r.verificationSheet.soundSystem,
        accommodationTeam: r.verificationSheet.accommodationTeam,
        volunteerSupport: r.verificationSheet.volunteerSupport,
        submittedAt: r.verificationSheet.submittedAt,
        approvedAt: r.verificationSheet.approvedAt,
        latestCallAttempt: r.verificationSheet.callAttempts?.[0] || null,
        totalAttempts: r.verificationSheet.callAttempts?.length || 0,
      }));
  }, [reports]);

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
      <div className="space-y-4 sm:space-y-6 animate-fadeIn">
        {/* Compact App Welcome & KPI Summary Card */}
        <div className="rounded-2xl p-4 sm:p-6 bg-card border border-border shadow-xs text-left relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground uppercase">
                  {translate("Welcome", language)}, {username}!
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  Coordinator
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Field Operations & Verification Management Portal
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateReport}
                disabled={creatingReport}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs min-h-10"
              >
                {creatingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                New Report
              </button>
              <button
                onClick={() => router.push("/coordinator/received-meetings")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent/80 border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-all duration-150 cursor-pointer active:scale-95 min-h-10"
              >
                <Inbox className="h-3.5 w-3.5 text-primary" />
                Received
              </button>
              <button
                onClick={() => router.push("/coordinator/confirmations")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent/80 border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-all duration-150 cursor-pointer active:scale-95 min-h-10"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-amber-500" />
                Confirmations
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3">
            <div className="p-2.5 rounded-xl bg-accent/40 border border-border/50 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Total Reports
              </span>
              <span className="text-base sm:text-xl font-black text-foreground mt-0.5 block">
                {reports.length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-accent/40 border border-border/50 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">
                In Review / Draft
              </span>
              <span className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                {reports.filter((r) => r.status === "DRAFT" || r.status === "PENDING" || r.status === "IN_REVIEW").length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-accent/40 border border-border/50 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
                Approved
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {reports.filter((r) => r.status === "APPROVED" || r.status === "CONFIRMED").length}
              </span>
            </div>
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

        {/* Mobile-Friendly Native Segmented Control */}
        <div className="flex overflow-x-auto no-scrollbar border border-border bg-card p-1 rounded-2xl gap-1 w-full sm:w-fit shadow-xs">
          <button
            type="button"
            onClick={() => setDashboardTab("reports")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-10 active:scale-95 ${
              dashboardTab === "reports"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab("calendar")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-10 active:scale-95 ${
              dashboardTab === "calendar"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardTab("analytics")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-10 active:scale-95 ${
              dashboardTab === "analytics"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Monthly Summary</span>
          </button>
        </div>

        {/* Tab 1: Meeting Reports & Unified Form Tracking */}
        {dashboardTab === "reports" && (
          <div className="glass-card rounded-2xl text-left p-4 sm:p-6 animate-fadeIn">
            <FormTrackingTable
              reports={reports}
              loading={reportsLoading}
              currentRole="COORDINATOR"
              currentUsername={username}
              onRefresh={fetchReports}
              onDeleteReport={handleDeleteReport}
              title="My Meeting Reports & Form Tracking"
              subtitle="Track submitted forms through Coordinator → Zonal Leader → State Leader → Admin workflow stages."
            />
          </div>
        )}

        {/* Tab 2: Meetings Calendar View */}
        {dashboardTab === "calendar" && (
          <div className="space-y-4 animate-fadeIn text-left">
            <CompletedVerificationsCalendar
              verifications={calendarVerifications}
              loading={reportsLoading}
              canEdit={true}
            />
          </div>
        )}

        {/* Tab 3: Monthly Summary & Charts */}
        {dashboardTab === "analytics" && (
          <div className="glass-card rounded-2xl text-left p-4 sm:p-6 animate-fadeIn">
            <MonthlySummary role="COORDINATOR" user={user} language={language} />
          </div>
        )}
      </div>    </DashboardLayout>
  );
}
