"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileText, CalendarCheck, Plus, Bell, Eye, Pencil, X, Loader2, Trash2, BarChart3, Inbox
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";
import { FormStatusBadge } from "@/components/form-status-badge";
import { FormTrackingTable } from "@/components/form-tracking-table";
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

          {/* Card 3: Received Meetings */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between group md:col-span-2">
            <div>
              <div className="inline-flex rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/10 p-3.5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-black text-foreground uppercase tracking-wider">
                Received Meetings
              </h3>
              <p className="mt-2 text-sm text-foreground/50 font-medium leading-relaxed">
                Review and begin outreach meetings forwarded to you by regional leaders for local coordination and verification.
              </p>
            </div>
            <button
              onClick={() => router.push("/coordinator/received-meetings")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 w-fit cursor-pointer active:scale-[0.97] shadow-md shadow-indigo-600/20"
            >
              View Received Meetings
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

        {/* Tab 2: Monthly Summary & Charts */}
        {dashboardTab === "analytics" && (
          <div className="glass-card rounded-2xl text-left p-4 sm:p-6 animate-fadeIn">
            <MonthlySummary role="COORDINATOR" user={user} language={language} />
          </div>
        )}
      </div>    </DashboardLayout>
  );
}
