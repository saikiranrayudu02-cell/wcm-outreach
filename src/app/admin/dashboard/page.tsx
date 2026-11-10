"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Users, FileSpreadsheet, Eye, UserPlus, Pencil, Trash2, 
  X, Save, FileText, ClipboardList, RefreshCw,
  Mail, Send, MessageSquare, CalendarCheck, Phone, BarChart3,
  ShieldCheck, PhoneCall, KeyRound, Power, CheckCircle2, XCircle, Search, Layers, GitFork
} from "lucide-react";
import { toast } from "sonner";

import { useUIStore } from "@/store/ui-store";
import { translate, formatRoleBadge } from "@/lib/translations";
import { FormStatusBadge } from "@/components/form-status-badge";
import { MeetingReviewModal } from "@/components/meeting-review-modal";
import { MonthlySummary } from "@/components/monthly-summary";
import { GeographicFilterBar, GeographicFilterState } from "@/components/geographic-filter-bar";
import { StateWorkloadOverview } from "@/components/state-workload-overview";
import { Lock } from "lucide-react";
import { CreateUserModal } from "@/components/create-user-modal";
import { EditUserModal } from "@/components/edit-user-modal";
import { ResetPasswordModal } from "@/components/reset-password-modal";
import { AdminHierarchyTree } from "@/components/admin-hierarchy-tree";
import { RoleBadge } from "@/components/role-badge";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, language } = useUIStore();
  
  const urlTab = searchParams.get("tab") as "users" | "reports" | "analytics" | "messages" | "confirmations" | null;
  const [activeTab, setActiveTab] = useState<"users" | "reports" | "analytics" | "messages" | "confirmations">(
    urlTab && ["users", "reports", "analytics", "messages", "confirmations"].includes(urlTab) ? urlTab : "users"
  );

  useEffect(() => {
    if (urlTab && ["users", "reports", "analytics", "messages", "confirmations"].includes(urlTab)) {
      setActiveTab(urlTab);
    } else if (!urlTab) {
      setActiveTab("users");
    }
  }, [urlTab]);

  const handleTabChange = (tab: "users" | "reports" | "analytics" | "messages" | "confirmations") => {
    setActiveTab(tab);
    router.push(`/admin/dashboard?tab=${tab}`, { scroll: false });
  };
  
  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Reports state
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [geoFilters, setGeoFilters] = useState<GeographicFilterState>({});

  // Notifications (Messages) state
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [msgRecipientId, setMsgRecipientId] = useState("");
  const [msgTitle, setMsgTitle] = useState("Admin Announcement");
  const [msgMessage, setMsgMessage] = useState("");
  const [msgSubmitting, setMsgSubmitting] = useState(false);

  // Confirmations state
  const [confirmationsList, setConfirmationsList] = useState<any[]>([]);
  const [confirmationsLoading, setConfirmationsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedConfirm, setSelectedConfirm] = useState<any | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // User Management state
  const [userViewMode, setUserViewMode] = useState<"directory" | "tree">("directory");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [userStateFilter, setUserStateFilter] = useState("ALL");
  const [userZoneFilter, setUserZoneFilter] = useState("ALL");
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [availableZones, setAvailableZones] = useState<any[]>([]);

  // User form modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);

  // Report details modal state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter && userRoleFilter !== "ALL") params.set("role", userRoleFilter);
      if (userStatusFilter && userStatusFilter !== "ALL") params.set("status", userStatusFilter);
      if (userStateFilter && userStateFilter !== "ALL") params.set("state", userStateFilter);
      if (userZoneFilter && userZoneFilter !== "ALL") params.set("zone", userZoneFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      toast.error("Failed to load users list");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchGeographicFilters = async () => {
    try {
      const res = await fetch("/api/admin/hierarchy/states");
      if (res.ok) {
        const data = await res.json();
        setAvailableStates(data);
      }
    } catch {
      console.error("Failed to load filter states");
    }
  };

  useEffect(() => {
    fetchGeographicFilters();
  }, []);

  useEffect(() => {
    if (!userStateFilter || userStateFilter === "ALL") {
      setAvailableZones([]);
      setUserZoneFilter("ALL");
      return;
    }
    const fetchZonesForFilter = async () => {
      try {
        const res = await fetch(`/api/admin/hierarchy/zones?stateName=${encodeURIComponent(userStateFilter)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableZones(data);
        }
      } catch {
        console.error("Failed to load filter zones");
      }
    };
    fetchZonesForFilter();
  }, [userStateFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [userSearch, userRoleFilter, userStatusFilter, userStateFilter, userZoneFilter]);

  const handleToggleUserStatus = async (u: any) => {
    const nextStatus = !u.isActive;
    const confirmMsg = nextStatus
      ? `Are you sure you want to reactivate ${u.username}?`
      : `Are you sure you want to deactivate ${u.username}? They will no longer be able to log in or take actions.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${u.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update status");
        return;
      }
      toast.success(data.message || "User status updated");
      fetchUsers();
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleOpenResetPassword = (u: any) => {
    setSelectedUserForReset(u);
    setShowResetModal(true);
  };

  const handleEditUserClick = (u: any) => {
    setSelectedUser(u);
    setShowEditModal(true);
  };

  const fetchReports = async (filters: GeographicFilterState = geoFilters) => {
    try {
      setReportsLoading(true);
      const params = new URLSearchParams();
      if (filters.state) params.set("state", filters.state);
      if (filters.zone) params.set("zone", filters.zone);
      if (filters.district) params.set("district", filters.district);
      if (filters.part) params.set("part", filters.part);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReportsList(data);
    } catch (err) {
      toast.error("Failed to load reports list");
    } finally {
      setReportsLoading(false);
    }
  };

  const handleGeoFilterChange = (newFilters: GeographicFilterState) => {
    setGeoFilters(newFilters);
    fetchReports(newFilters);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotificationsList(data);
    } catch (err) {
      toast.error("Failed to load sent messages");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchConfirmations = async () => {
    try {
      const res = await fetch("/api/confirmations");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfirmationsList(data);
    } catch (err) {
      toast.error("Failed to load meeting confirmations list");
    } finally {
      setConfirmationsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReports();
    fetchNotifications();
    fetchConfirmations();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgRecipientId) {
      toast.error("Please select a recipient Coordinator");
      return;
    }
    if (!msgMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setMsgSubmitting(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: msgRecipientId,
          title: msgTitle,
          message: msgMessage,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to send message");
      } else {
        toast.success("Message sent successfully");
        setMsgMessage("");
        setMsgTitle("Admin Announcement");
        setMsgRecipientId("");
        fetchNotifications();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setMsgSubmitting(false);
    }
  };

  const handleReviewConfirmation = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedConfirm) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/confirmations/${selectedConfirm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminFeedback: adminFeedback || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to update request");
      } else {
        toast.success(`Request ${status === "APPROVED" ? "approved" : "rejected"} successfully!`);
        setShowConfirmModal(false);
        setAdminFeedback("");
        setSelectedConfirm(null);
        fetchConfirmations();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setReviewSubmitting(false);
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

  const handleReviewReport = async (action: "APPROVE" | "REQUEST_CHANGES" | "REJECT") => {
    if (!reportDetail) return;
    if (["REQUEST_CHANGES", "REJECT"].includes(action) && !reviewFeedback.trim()) {
      toast.error("Comments are required to reject or request changes.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: reviewFeedback }),
      });
      if (res.ok) {
        toast.success(`Report ${action === "APPROVE" ? "Approved & Finalized" : action === "REJECT" ? "Rejected" : "Returned for changes"}`);
        setReviewFeedback("");
        setSelectedReportId(null);
        setReportDetail(null);
        fetchReports();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to review report");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Admin Dashboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">
              Manage system users, view submitted reports, and monitor activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/find-people"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Users className="h-4 w-4" />
              Find People
            </a>

            <button
              onClick={() => {
                fetchUsers();
                fetchReports();
                fetchNotifications();
                fetchConfirmations();
                toast.success("Dashboard data refreshed");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.96]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            
            {activeTab === "users" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700 transition-all shadow-sm cursor-pointer active:scale-[0.96]"
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="overflow-x-auto pb-1 max-w-full no-scrollbar">
          <div className="flex border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 rounded-2xl gap-1.5 w-max sm:w-fit shadow-xs">
            <button
              onClick={() => handleTabChange("users")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <Users className="h-4 w-4" />
              User Management
            </button>
            <button
              onClick={() => handleTabChange("reports")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "reports"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Submitted Reports
            </button>
            <button
              onClick={() => handleTabChange("analytics")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Monthly Summary
            </button>
            <button
              onClick={() => handleTabChange("messages")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "messages"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <Mail className="h-4 w-4" />
              Send Messages
            </button>
            <button
              onClick={() => handleTabChange("confirmations")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "confirmations"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <CalendarCheck className="h-4 w-4" />
              Confirmations
            </button>
          </div>
        </div>

        {/* Tab Contents: Users */}
        {activeTab === "users" && (
          <div className="space-y-4 text-left animate-fadeIn">
            {/* View Mode Switcher and Create Button Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 self-start">
                <button
                  type="button"
                  onClick={() => setUserViewMode("directory")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    userViewMode === "directory"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Directory List
                </button>
                <button
                  type="button"
                  onClick={() => setUserViewMode("tree")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    userViewMode === "tree"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GitFork className="h-3.5 w-3.5" />
                  Organizational Tree
                </button>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-all shadow-sm shadow-blue-500/20 cursor-pointer active:scale-[0.96]"
                >
                  <UserPlus className="h-4 w-4" />
                  Create New User
                </button>
              </div>
            </div>

            {/* Tree View */}
            {userViewMode === "tree" ? (
              <AdminHierarchyTree
                onEditUser={handleEditUserClick}
                onResetPassword={handleOpenResetPassword}
                onToggleStatus={handleToggleUserStatus}
              />
            ) : (
              /* Directory View */
              <div className="space-y-4">
                {/* Advanced Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, username, phone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Role Filter */}
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="STATE_LEADER">State Leader</option>
                    <option value="ZONE_LEADER">Zonal Leader</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Accounts</option>
                    <option value="INACTIVE">Deactivated Accounts</option>
                  </select>

                  {/* State Filter */}
                  <select
                    value={userStateFilter}
                    onChange={(e) => {
                      setUserStateFilter(e.target.value);
                      setUserZoneFilter("ALL");
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="ALL">All States</option>
                    {availableStates.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>

                  {/* Zone Filter */}
                  <select
                    value={userZoneFilter}
                    onChange={(e) => setUserZoneFilter(e.target.value)}
                    disabled={!userStateFilter || userStateFilter === "ALL" || availableZones.length === 0}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50"
                  >
                    <option value="ALL">All Zones</option>
                    {availableZones.map((z) => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>

                {/* Directory Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden text-left">
                  {usersLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                      <span className="text-xs font-bold uppercase tracking-wider">Loading users...</span>
                    </div>
                  ) : usersList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">No Users Found Matching Filters</div>
                  ) : (
                    <>
                      {/* Mobile Cards (Phone View: < md) */}
                      <div className="md:hidden space-y-3 p-3">
                        {usersList.map((u) => (
                          <div
                            key={u.id}
                            className={`p-4 rounded-2xl border space-y-3 shadow-xs ${
                              u.isActive
                                ? "bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800"
                                : "bg-red-50/30 dark:bg-red-950/10 border-red-200/60 dark:border-red-900/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                                  {u.name || u.username}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-semibold block">
                                  @{u.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <RoleBadge role={u.role} size="xs" />
                                {u.isActive ? (
                                  <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">Active</span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-red-500">Deactivated</span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border-y border-slate-200/60 dark:border-slate-800/60 py-2">
                              {u.phoneNumber && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-semibold">Phone:</span>
                                  <a href={`tel:${u.phoneNumber}`} className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {u.phoneNumber}
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-semibold">Hierarchy:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {u.role === "ADMIN" ? "National Headquarters / Central" : `${u.displayState || u.state || "All"} ${u.displayZone ? `• ${u.displayZone}` : ""} ${u.displayDistrict ? `• ${u.displayDistrict}` : ""}`}
                                </span>
                              </div>
                              {u.role === "COORDINATOR" && u.parentZonalLeader && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 font-semibold">Zonal Leader:</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                    {u.parentZonalLeader.name} (@{u.parentZonalLeader.username})
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => handleEditUserClick(u)}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenResetPassword(u)}
                                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                Password
                              </button>
                              {u.role !== "ADMIN" && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                                    u.isActive
                                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100"
                                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                  }`}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  {u.isActive ? "Deactivate" : "Activate"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop / Tablet Table View (>= md) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider text-[11px]">
                              <th className="px-6 py-4">User Details</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Hierarchy Assignment</th>
                              <th className="px-6 py-4">Parent Zonal Leader</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                            {usersList.map((u) => (
                              <tr
                                key={u.id}
                                className={`transition-colors ${
                                  u.isActive
                                    ? "hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                                    : "bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40 opacity-80"
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-900 dark:text-white block">{u.name || u.username}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-300 block font-medium">@{u.username}</span>
                                  {u.phoneNumber && (
                                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                                      <Phone className="h-3 w-3" />
                                      {u.phoneNumber}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <RoleBadge role={u.role} size="sm" />
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {u.role === "ADMIN" ? (
                                    <span className="text-slate-400 italic">National Headquarters / Central</span>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <span className="font-bold block text-slate-800 dark:text-white">{u.displayState || u.state || "All States"}</span>
                                      {(u.displayZone || u.zone) && (
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Zone: {u.displayZone || u.zone}</span>
                                      )}
                                      {(u.displayDistrict || u.district) && (
                                        <span className="text-[10px] text-slate-400 block">District: {u.displayDistrict || u.district}</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                  {u.role === "COORDINATOR" ? (
                                    u.parentZonalLeader ? (
                                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 text-emerald-800 dark:text-emerald-300">
                                        <span className="font-black block text-[11px]">{u.parentZonalLeader.name}</span>
                                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium block">@{u.parentZonalLeader.username}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold italic">Unassigned</span>
                                    )
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {u.isActive ? (
                                    <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-200/40">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-200/40">
                                      Deactivated
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      title="Edit User"
                                      onClick={() => handleEditUserClick(u)}
                                      className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-700 cursor-pointer transition-colors"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      title="Reset Password"
                                      onClick={() => handleOpenResetPassword(u)}
                                      className="rounded-xl p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                                    >
                                      <KeyRound className="h-4 w-4" />
                                    </button>
                                    {u.role !== "ADMIN" && (
                                      <button
                                        title={u.isActive ? "Deactivate User" : "Reactivate User"}
                                        onClick={() => handleToggleUserStatus(u)}
                                        className={`rounded-xl p-2 cursor-pointer transition-colors ${
                                          u.isActive
                                            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                        }`}
                                      >
                                        <Power className="h-4 w-4" />
                                      </button>
                                    )}
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
              </div>
            )}
          </div>
        )}

      {/* Tab Contents: Reports */}
      {activeTab === "reports" && (
        <div className="space-y-4 animate-fadeIn">
          {/* State-Wise Workload & Calling Analytics Header */}
          <StateWorkloadOverview
            onSelectGeographicScope={(st, zn, dt) => handleGeoFilterChange({ state: st, zone: zn, district: dt })}
          />

          {/* Hierarchical Geographic Dependent Filter Bar */}
          <GeographicFilterBar onFilterChange={handleGeoFilterChange} />

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-left">
            {reportsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Loading reports for selected region...</span>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider italic">
                {geoFilters.state || geoFilters.zone || geoFilters.district
                  ? `No Forms Found for Selected Location (${[geoFilters.state, geoFilters.zone ? `${geoFilters.zone} Zone` : null, geoFilters.district, geoFilters.part].filter(Boolean).join(" • ")})`
                  : "No Reports Found"}
              </div>
            ) : (
            <>
              {/* Mobile Cards (Phone View: < md) */}
              <div className="md:hidden space-y-3 p-3">
                {reportsList.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {r.reportId}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {r.title || `Outreach Meeting ${r.reportId}`}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {r.state}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            {r.district}
                          </span>
                          {r.isCallLocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" /> Answered
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold block mt-1">
                          Coordinator: {r.coordinatorName || r.leader?.username || "Leader"}
                        </span>
                      </div>
                    </div>

                    {/* 3 Form Status Badges */}
                    <div className="grid grid-cols-3 gap-1.5 py-2.5 border-y border-slate-200 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-black text-slate-600 dark:text-slate-400 block mb-1">1. Verify</span>
                        <FormStatusBadge status={r.verificationStatus} size="sm" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-black text-slate-600 dark:text-slate-400 block mb-1">2. Attend</span>
                        <FormStatusBadge status={r.attendanceStatus} isLocked={r.isAttendanceLocked} size="sm" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-black text-slate-600 dark:text-slate-400 block mb-1">3. Eval</span>
                        <FormStatusBadge status={r.evaluationStatus} isLocked={r.isEvaluationLocked} size="sm" />
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-bold">Dates:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{r.meetingDates || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-bold">Location:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-50 text-right">{r.location || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-bold">Zone:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{r.leader?.zone || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setSelectedReportId(r.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        Open Forms & Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black uppercase tracking-wider text-[11px]">
                      <th className="px-5 py-4">Meeting Details</th>
                      <th className="px-5 py-4">Coordinator</th>
                      <th className="px-4 py-4 text-center">1. Verification</th>
                      <th className="px-4 py-4 text-center">2. Attendance</th>
                      <th className="px-4 py-4 text-center">3. Evaluation</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                    {reportsList.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">{r.reportId}</div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">{r.title || `Outreach Meeting ${r.reportId}`}</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">{r.meetingDates || "N/A"} • {r.location || "N/A"}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold block text-xs text-slate-900 dark:text-white">{r.coordinatorName || r.leader?.username}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {r.state}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                              {r.zone} Zone
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                              {r.district}
                            </span>
                            {r.isCallLocked && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" /> Answered & Locked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormStatusBadge status={r.verificationStatus} size="sm" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormStatusBadge status={r.attendanceStatus} isLocked={r.isAttendanceLocked} size="sm" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <FormStatusBadge status={r.evaluationStatus} size="sm" isLocked={r.isEvaluationLocked} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReportId(r.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-[0.96]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review Forms
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

        {/* Tab Contents: Analytics / Monthly Summary */}
        {activeTab === "analytics" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm p-4 sm:p-6 animate-fadeIn text-left">
            <MonthlySummary role="ADMIN" user={user} language={language} />
          </div>
        )}

        {/* Tab Contents: Messages */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-left">
            {/* Compose Card */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm p-6 space-y-4 h-fit">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Compose Message
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Send a direct message to a specific coordinator. The message is only visible to the recipient in their notifications.
              </p>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-1.5">
                    Select Recipient Coordinator *
                  </label>
                  <select
                    required
                    value={msgRecipientId}
                    onChange={(e) => setMsgRecipientId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                  >
                    <option value="">-- Choose Coordinator --</option>
                    {usersList
                      .filter((u) => u.role === "COORDINATOR" || u.role === "LEADER")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} (State: {u.state || "All"})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-1.5">
                    Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="e.g. System Announcement"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-1.5">
                    Message Content *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={msgMessage}
                    onChange={(e) => setMsgMessage(e.target.value)}
                    placeholder="Type your message details here..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={msgSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                  {msgSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Sent Messages History List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  Sent Messages History
                </h3>
              </div>

              {notificationsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Loading sent history...</span>
                </div>
              ) : notificationsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">No Messages Sent Yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        <th className="px-6 py-4">Recipient</th>
                        <th className="px-6 py-4">Title & Message</th>
                        <th className="px-6 py-4">Date Sent</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {notificationsList.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                            {n.recipient?.username}
                          </td>
                          <td className="px-6 py-4 max-w-xs sm:max-w-sm lg:max-w-md">
                            <span className="font-bold block text-slate-800 dark:text-white text-xs">{n.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5 font-medium">{n.message}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {n.read ? (
                              <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 border border-emerald-200/20">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Unread
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Contents: Confirmations */}
        {activeTab === "confirmations" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden animate-fadeIn text-left">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarCheck className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                Coordinators' Proposals
              </h3>
            </div>

            {confirmationsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Loading proposals...</span>
              </div>
            ) : confirmationsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">No Proposals Found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      <th className="px-6 py-4">Coordinator</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4">Message</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {confirmationsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {c.leader?.username}
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase mt-0.5">State: {c.leader?.state || "N/A"} | Zone: {c.leader?.zone || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold block text-slate-800 dark:text-white text-xs">{c.location}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold mt-0.5">Dates: {c.meetingDates}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Exp. Attendance: {c.expectedAttendance}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs whitespace-pre-wrap text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed">
                          {c.message}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            c.status === "PENDING"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/30"
                              : c.status === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200/30"
                              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/30"
                          }`}>
                            {c.status}
                          </span>
                          {c.adminFeedback && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 max-w-xs truncate">
                              Feedback: "{c.adminFeedback}"
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {c.status === "PENDING" ? (
                            <button
                              onClick={() => {
                                setSelectedConfirm(c);
                                setAdminFeedback("");
                                setShowConfirmModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors cursor-pointer active:scale-[0.96]"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Role-Based Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
      />

      {/* Edit User Details & Territory Assignment Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={fetchUsers}
      />

      {/* Secure Password Reset Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        user={selectedUserForReset}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUserForReset(null);
        }}
        onPasswordReset={fetchUsers}
      />

      {/* Meeting-wise 3-Forms Review Modal */}
      <MeetingReviewModal
        isOpen={!!selectedReportId}
        onClose={() => {
          setSelectedReportId(null);
          setReportDetail(null);
        }}
        reportId={selectedReportId}
        role="ADMIN"
        username="Admin"
        onUpdated={fetchReports}
      />

      {/* Modal: Review Confirmation Request */}
      {showConfirmModal && selectedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto animate-modal my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Review Meeting Proposal
              </h3>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedConfirm(null);
                  setAdminFeedback("");
                }} 
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-4 text-xs space-y-2.5 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Submitted By</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedConfirm.leader?.username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Location</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedConfirm.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Proposed Dates</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedConfirm.meetingDates}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Expected Attendance</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedConfirm.expectedAttendance}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Leader's Custom Message</span>
                  <p className="mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 italic font-semibold leading-relaxed">
                    "{selectedConfirm.message}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-1.5">
                  Feedback / Comments for the Leader
                </label>
                <textarea
                  rows={3}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="e.g. Approved. Please ensure sound system arrangements are complete."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div className="flex justify-between items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedConfirm(null);
                    setAdminFeedback("");
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewConfirmation("REJECTED")}
                    disabled={reviewSubmitting}
                    className="rounded-xl border border-red-200 hover:bg-red-50 dark:border-red-900/35 dark:hover:bg-red-950/20 text-xs font-bold uppercase tracking-wider text-red-500 px-4 py-2.5 disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReviewConfirmation("APPROVED")}
                    disabled={reviewSubmitting}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.98] transition-all"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
