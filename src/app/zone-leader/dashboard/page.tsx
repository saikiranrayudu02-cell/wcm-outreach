"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Users, FileSpreadsheet, Eye, UserPlus, Pencil, Trash2, 
  X, Save, FileText, ClipboardList, RefreshCw,
  Mail, Send, MessageSquare, CalendarCheck, BarChart3, Phone
} from "lucide-react";
import { toast } from "sonner";

import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { MonthlySummary } from "@/components/monthly-summary";

export default function ZoneLeaderDashboardPage() {
  const { user, language } = useUIStore();
  const [activeTab, setActiveTab] = useState<"users" | "reports" | "messages" | "confirmations" | "analytics">("users");
  
  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Reports state
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

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

  // User form modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("COORDINATOR");
  const [state, setState] = useState("");
  const [part, setPart] = useState("");
  const [zone, setZone] = useState("");

  useEffect(() => {
    if (user?.zone) {
      setZone(user.zone);
    }
  }, [user]);
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Report details modal state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [forwardTo, setForwardTo] = useState<"STATE_LEADER" | "ADMIN" | "BOTH">("BOTH");
  const [submitting, setSubmitting] = useState(false);

  // Zone Leader Report Editing State
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [editVForm, setEditVForm] = useState<any>({});
  const [editAForm, setEditAForm] = useState<any>({});
  const [editRForm, setEditRForm] = useState<any>({});

  // Send Modal state for table Action column
  const [sendModalReport, setSendModalReport] = useState<any | null>(null);
  const [sendDestination, setSendDestination] = useState<"BOTH" | "STATE_LEADER" | "ADMIN">("BOTH");
  const [sendComment, setSendComment] = useState("");
  const [sendSubmitting, setSendSubmitting] = useState(false);

  const handleOpenSendModal = (report: any) => {
    setSendModalReport(report);
    setSendDestination("BOTH");
    setSendComment("");
  };

  const handleConfirmSendReport = async () => {
    if (!sendModalReport) return;
    setSendSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${sendModalReport.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          comment: sendComment.trim() || "Report approved and forwarded by Zone Leader.",
          forwardTo: sendDestination,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const destName =
          sendDestination === "BOTH"
            ? "State Leader & Admin"
            : sendDestination === "ADMIN"
            ? "Admin"
            : "State Leader";
        toast.success(`Report ${sendModalReport.reportId} successfully sent to ${destName}!`);
        setSendModalReport(null);
        fetchReports();
      } else {
        toast.error(data.error || "Failed to send report");
      }
    } catch (err) {
      toast.error("An error occurred while sending the report");
    } finally {
      setSendSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      toast.error("Failed to load users list");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReportsList(data);
    } catch (err) {
      toast.error("Failed to load reports list");
    } finally {
      setReportsLoading(false);
    }
  };

  const handleReviewSubmit = async (action: "APPROVE" | "REQUEST_CHANGES" | "REJECT") => {
    if (["REQUEST_CHANGES", "REJECT"].includes(action) && !reviewFeedback.trim()) {
      toast.error("Comments are required to reject or request changes.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: reviewFeedback,
          forwardTo: action === "APPROVE" ? forwardTo : undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Report ${action === "APPROVE" ? "Approved & Forwarded" : action === "REJECT" ? "Rejected" : "Returned for changes"}`);
        setSelectedReportId(null);
        setReportDetail(null);
        setReviewFeedback("");
        setForwardTo("BOTH");
        fetchReports();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Username and Password are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
          state: state || null,
          part: part || null,
          zone: zone || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to create user");
      } else {
        toast.success("User Created Successfully");
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUserClick = (u: any) => {
    setSelectedUser(u);
    setRole(u.role);
    setState(u.state || "");
    setPart(u.part || "");
    setZone(u.zone || "");
    setPassword(""); // leave blank unless changing
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          state: state || null,
          part: part || null,
          zone: zone || null,
          password: password || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to update user");
      } else {
        toast.success("User Updated Successfully");
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to delete user");
      } else {
        toast.success("User Deleted Successfully");
        fetchUsers();
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgRecipientId) {
      toast.error("Please select a recipient");
      return;
    }
    if (!msgMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setMsgSubmitting(true);
    try {
      const payload: any = {
        title: msgTitle || "Zone Announcement",
        message: msgMessage,
      };

      if (["BOTH", "STATE_LEADER", "ADMIN"].includes(msgRecipientId)) {
        payload.targetGroup = msgRecipientId;
      } else {
        payload.recipientId = msgRecipientId;
      }

      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to send message");
      } else {
        toast.success(result.message || "Message sent successfully");
        setMsgMessage("");
        setMsgTitle("Zone Announcement");
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
    setIsEditingReport(false);
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

  const startEditingReport = (data: any) => {
    if (!data) return;
    setEditVForm({
      convenerName: data.verification?.convenerName || "",
      churchMinistryName: data.verification?.churchMinistryName || "",
      stateDistrictCity: data.verification?.stateDistrictCity || "",
      contactNumber: data.verification?.contactNumber || "",
      meetingDates: data.verification?.meetingDates || "",
      numberOfDays: data.verification?.numberOfDays ?? 1,
      expectedAttendance: data.verification?.expectedAttendance ?? 0,
      yearsOfMinistry: data.verification?.yearsOfMinistry ?? 0,
      churchMembers: data.verification?.churchMembers ?? 0,
      workersLeaders: data.verification?.workersLeaders ?? 0,
      knowAboutWcm: data.verification?.knowAboutWcm || "Other Church Ministers",
      readWcmBooks: Boolean(data.verification?.readWcmBooks),
      attendedProphetMeeting: Boolean(data.verification?.attendedProphetMeeting),
      meetingHallStage: data.verification?.meetingHallStage || "Arranged By Host",
      soundSystem: data.verification?.soundSystem || "Arranged By Host",
      accommodationTeam: data.verification?.accommodationTeam || "Arranged By Host",
      volunteerSupport: data.verification?.volunteerSupport || "Arranged By Host",
    });
    setEditAForm({
      date: data.attendance?.date ? new Date(data.attendance.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      location: data.attendance?.location || "",
      fieldExecuter: data.attendance?.fieldExecuter || "",
      coordinator: data.attendance?.coordinator || "",
      membersAttended: data.attendance?.membersAttended ?? 0,
      pastorsAttended: data.attendance?.pastorsAttended ?? 0,
      remarks: data.attendance?.remarks || "",
    });
    setEditRForm({
      overallMeetingOutcome: data.report?.overallMeetingOutcome || "",
      congregationResponse: data.report?.congregationResponse || "",
      continueFellowship: data.report?.continueFellowship ?? true,
      futureOpportunities: data.report?.futureOpportunities || [],
      localChurchInfluence: data.report?.localChurchInfluence || "",
      networkOfPastors: data.report?.networkOfPastors || "",
      keyLeadersConnected: data.report?.keyLeadersConnected || "",
      challengesObserved: data.report?.challengesObserved || "",
      strengthsObserved: data.report?.strengthsObserved || "",
      opportunityForWcm: data.report?.opportunityForWcm || "",
      coordinatorName: data.report?.coordinatorName || "",
      designation: data.report?.designation || "",
      signature: data.report?.signature || "",
      submissionDate: data.report?.submissionDate ? new Date(data.report.submissionDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      followingWcmMembersCount: data.report?.followingWcmMembersCount ?? 0,
    });
    setIsEditingReport(true);
  };

  const handleEditReport = async (id: string) => {
    setSelectedReportId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReportDetail(data);
      startEditingReport(data);
    } catch (err) {
      toast.error("Failed to load report for editing");
      setSelectedReportId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveReportEdit = async () => {
    if (!selectedReportId) return;
    setSavingReport(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification: editVForm,
          attendance: editAForm,
          report: editRForm,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update report");
      }

      toast.success("Report updated successfully by Zone Leader");
      
      const refRes = await fetch(`/api/reports/${selectedReportId}`);
      if (refRes.ok) {
        const updatedData = await refRes.json();
        setReportDetail(updatedData);
      }
      setIsEditingReport(false);
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Error saving report edits");
    } finally {
      setSavingReport(false);
    }
  };


  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("COORDINATOR");
    setZone(user?.zone || "");
    setState("");
    setPart("");
    setZone("");
    setSelectedUser(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Zone Leader Dashboard ({user?.zone})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">
              Manage zone coordinators, view submitted reports, and monitor activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/find-people"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-[0.96]"
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-655 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.96]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            
            {activeTab === "users" && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-755 transition-all shadow-sm cursor-pointer active:scale-[0.96]"
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="overflow-x-auto pb-1 max-w-full no-scrollbar">
          <div className="flex border border-slate-200 dark:border-slate-805 bg-slate-105/50 dark:bg-slate-950 p-1 rounded-2xl gap-1 w-max sm:w-fit">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800"
                  : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              <Users className="h-4 w-4" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "reports"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800"
                  : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Submitted Reports
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "messages"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800"
                  : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              <Mail className="h-4 w-4" />
              Send Messages
            </button>
            <button
              onClick={() => setActiveTab("confirmations")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "confirmations"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800"
                  : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              <CalendarCheck className="h-4 w-4" />
              Confirmations
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800"
                  : "text-slate-555 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              {translate("Monthly Summary", language)}
            </button>
          </div>
        </div>

        {/* Tab Contents: Users */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            {usersLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Loading users...</span>
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-505 font-bold uppercase tracking-wider italic">No Users Found</div>
            ) : (
              <>
              {/* Mobile Cards (Phone View: < md) */}
              <div className="md:hidden space-y-3 p-3">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
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
                      <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        {u.role.replace(/_/g, " ")}
                      </span>
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
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          State: {u.state || "All"} | Zone: {u.zone || "All"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleEditUserClick(u)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer min-h-10 active:scale-[0.96]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors border border-red-500/10 cursor-pointer min-h-10 active:scale-[0.96]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-805/10 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase tracking-widest text-[10px]">
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Hierarchy Assignment</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            {u.role.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          {u.role === "ADMIN" ? (
                            <span className="text-slate-400 italic">Full System Access</span>
                          ) : (
                            <span>
                              State: {u.state || "All"} | Part: {u.part || "All"} | Zone: {u.zone || "All"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1">
                          <button
                            onClick={() => handleEditUserClick(u)}
                            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-700 cursor-pointer transition-colors active:scale-[0.95]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors active:scale-[0.95]"
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Tab Contents: Reports */}
      {activeTab === "reports" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          {reportsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold uppercase tracking-wider">Loading reports...</span>
            </div>
          ) : reportsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-505 font-bold uppercase tracking-wider italic">No Reports Found</div>
          ) : (
            <>
              {/* Mobile Cards (Phone View: < md) */}
              <div className="md:hidden space-y-3 p-3">
                {reportsList.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">
                          {r.reportId}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          Version: v{r.version} • {r.leader?.username || "Leader"}
                        </span>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                        r.rawStatus === "APPROVED"
                          ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-805 dark:text-emerald-400 border-emerald-250/30"
                          : r.rawStatus === "REJECTED"
                          ? "bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-405 border-red-250/30"
                          : r.rawStatus === "REQUEST_CHANGES"
                          ? "bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border-amber-250/30"
                          : "bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border-blue-250/30"
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
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Zone:</span>
                        <span className="font-bold">{r.leader?.zone || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenReport(r.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer min-h-10 active:scale-[0.96]"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>

                      {["SUBMITTED", "ZONE_LEADER_REVIEW", "REQUEST_CHANGES"].includes(r.rawStatus) && (
                        <button
                          onClick={() => handleEditReport(r.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors border border-amber-500/10 cursor-pointer min-h-10 active:scale-[0.96]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}

                      {["SUBMITTED", "ZONE_LEADER_REVIEW"].includes(r.rawStatus) && (
                        <button
                          onClick={() => handleOpenSendModal(r)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer min-h-10 active:scale-[0.96]"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send
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
                    <tr className="bg-slate-50/50 dark:bg-slate-805/10 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase tracking-widest text-[10px]">
                      <th className="px-6 py-4">Report ID</th>
                      <th className="px-6 py-4">Leader Info</th>
                      <th className="px-6 py-4">Dates / Location</th>
                      <th className="px-6 py-4 text-center">Version</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {reportsList.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-805 dark:text-white">{r.reportId}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold block text-xs">{r.leader?.username}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold">State: {r.leader?.state || "N/A"} | Zone: {r.leader?.zone || "N/A"}</span>
                          {r.forwardedBy && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold mt-0.5">
                              Last Action: {r.forwardedBy}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-300">{r.meetingDates || "N/A"}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{r.location || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-500">
                          v{r.version}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            r.rawStatus === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-805 dark:text-emerald-400 border-emerald-250/30"
                              : r.rawStatus === "REJECTED"
                              ? "bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-405 border-red-250/30"
                              : r.rawStatus === "REQUEST_CHANGES"
                              ? "bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border-amber-250/30"
                              : "bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border-blue-250/30"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenReport(r.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-500/10 cursor-pointer active:scale-[0.96]"
                            >
                              <Eye className="h-4 w-4" />
                              {translate("View", language)}
                            </button>

                            {["SUBMITTED", "ZONE_LEADER_REVIEW", "REQUEST_CHANGES"].includes(r.rawStatus) && (
                              <button
                                onClick={() => handleEditReport(r.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors border border-amber-500/10 cursor-pointer active:scale-[0.96]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            )}

                            {["SUBMITTED", "ZONE_LEADER_REVIEW"].includes(r.rawStatus) && (
                              <button
                                onClick={() => handleOpenSendModal(r)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-[0.96]"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Send
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
      )}

        {/* Tab Contents: Messages */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Compose Card */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm p-6 space-y-4 h-fit text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Compose Message
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Send a direct message to a specific coordinator. The message is only visible to the selected coordinator in their notification panel.
              </p>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                    Select Recipient *
                  </label>
                  <select
                    required
                    value={msgRecipientId}
                    onChange={(e) => setMsgRecipientId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                  >
                    <option value="">-- Select Recipient --</option>
                    <optgroup label="Higher Leadership">
                      <option value="BOTH">Both (State Leader & Admin)</option>
                      <option value="STATE_LEADER">State Leader Only</option>
                      <option value="ADMIN">Admin Only</option>
                    </optgroup>
                    <optgroup label="Zone Coordinators">
                      {usersList
                        .filter((u) => (u.role === "COORDINATOR" || u.role === "LEADER") && u.zone === user?.zone)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} (State: {u.state || "All"})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                    Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="e.g. Urgent Review Required"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                    Message Content *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={msgMessage}
                    onChange={(e) => setMsgMessage(e.target.value)}
                    placeholder="Type your message details here..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-905 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
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
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
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
                <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-505 font-bold uppercase tracking-wider italic">No Messages Sent Yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-805/10 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase tracking-widest text-[10px]">
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
                            <span className="font-bold block text-slate-850 dark:text-white text-xs">{n.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5 font-medium">{n.message}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-450">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {n.read ? (
                              <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 border border-emerald-250/20">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden animate-fadeIn text-left">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-855 dark:text-white flex items-center gap-2">
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
              <div className="py-12 text-center text-xs text-slate-450 dark:text-slate-505 font-bold uppercase tracking-wider italic">No Proposals Found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-805/10 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase tracking-widest text-[10px]">
                      <th className="px-6 py-4">Coordinator</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4">Message</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                    {confirmationsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          {c.leader?.username}
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase mt-0.5">State: {c.leader?.state || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold block text-slate-850 dark:text-white text-xs">{c.location}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold mt-0.5">Dates: {c.meetingDates}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Exp. Attendance: {c.expectedAttendance}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs whitespace-pre-wrap text-slate-655 dark:text-slate-350 text-xs font-semibold leading-relaxed">
                          {c.message}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            c.status === "PENDING"
                              ? "bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-250/30"
                              : c.status === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-800 dark:text-emerald-400 border-emerald-250/30"
                              : "bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-400 border-red-250/30"
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

        {/* Tab Contents: Analytics */}
        {activeTab === "analytics" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-sm p-6 animate-fadeIn">
            <MonthlySummary role="ZONE_LEADER" user={user} language={language} />
          </div>
        )}
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto animate-modal my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-805 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Create Coordinator User
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. pastor_sam"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold cursor-pointer"
                >
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="LEADER">Leader</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. AP"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Part</label>
                  <input
                    type="text"
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                    placeholder="e.g. Part-1"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Zone (Locked to your zone)</label>
                <input
                  type="text"
                  disabled
                  value={zone}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-250 dark:border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto animate-modal my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-805 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Edit User Settings: {selectedUser.username}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold cursor-pointer"
                >
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="LEADER">Leader</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. AP"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Part</label>
                  <input
                    type="text"
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                    placeholder="e.g. Part-1"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">Zone (Locked to your zone)</label>
                <input
                  type="text"
                  disabled
                  value={zone}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-255 dark:border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Report */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col text-left animate-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-wider">
                  Meeting Report Details ({reportDetail?.reportId})
                </h3>
                <span className="inline-flex rounded-full bg-blue-50 dark:bg-blue-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1 border border-blue-200/50">
                  Status: {reportDetail?.status?.replace(/_/g, " ")} (v{reportDetail?.version})
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!isEditingReport && ["SUBMITTED", "ZONE_LEADER_REVIEW", "REQUEST_CHANGES"].includes(reportDetail?.rawStatus) && (
                  <button
                    onClick={() => startEditingReport(reportDetail)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-[0.96] shadow-sm"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Report
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedReportId(null);
                    setReportDetail(null);
                    setReviewFeedback("");
                    setIsEditingReport(false);
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {detailLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Loading report details...</span>
                </div>
              ) : reportDetail && isEditingReport ? (
                /* Zone Leader Edit Form Mode */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveReportEdit();
                  }}
                  className="space-y-8"
                >
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        Editing Report {reportDetail.reportId}
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        You have Zone Leader rights to correct coordinator details before forwarding to State Leader or Admin.
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-black bg-amber-500 text-white px-2 py-0.5 rounded-md">
                      Zone Leader Edit Mode
                    </span>
                  </div>

                  {/* 1. Verification Sheet Section */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <FileText className="h-4.5 w-4.5" />
                      1. Verification Sheet
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Convener Name *</label>
                        <input
                          type="text"
                          required
                          value={editVForm.convenerName || ""}
                          onChange={(e) => setEditVForm({ ...editVForm, convenerName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Church / Ministry Name *</label>
                        <input
                          type="text"
                          required
                          value={editVForm.churchMinistryName || ""}
                          onChange={(e) => setEditVForm({ ...editVForm, churchMinistryName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">State / District / City *</label>
                        <input
                          type="text"
                          required
                          value={editVForm.stateDistrictCity || ""}
                          onChange={(e) => setEditVForm({ ...editVForm, stateDistrictCity: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Contact Number *</label>
                        <input
                          type="text"
                          required
                          value={editVForm.contactNumber || ""}
                          onChange={(e) => setEditVForm({ ...editVForm, contactNumber: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Meeting Dates *</label>
                        <input
                          type="text"
                          required
                          value={editVForm.meetingDates || ""}
                          onChange={(e) => setEditVForm({ ...editVForm, meetingDates: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Expected Attendance</label>
                        <input
                          type="number"
                          value={editVForm.expectedAttendance ?? 0}
                          onChange={(e) => setEditVForm({ ...editVForm, expectedAttendance: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Church Members Count</label>
                        <input
                          type="number"
                          value={editVForm.churchMembers ?? 0}
                          onChange={(e) => setEditVForm({ ...editVForm, churchMembers: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Workers / Leaders Count</label>
                        <input
                          type="number"
                          value={editVForm.workersLeaders ?? 0}
                          onChange={(e) => setEditVForm({ ...editVForm, workersLeaders: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Meeting Hall & Stage</label>
                        <select
                          value={editVForm.meetingHallStage || "Arranged By Host"}
                          onChange={(e) => setEditVForm({ ...editVForm, meetingHallStage: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="Arranged By Host">Arranged By Host</option>
                          <option value="Arranged By WCM">Arranged By WCM</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Sound System</label>
                        <select
                          value={editVForm.soundSystem || "Arranged By Host"}
                          onChange={(e) => setEditVForm({ ...editVForm, soundSystem: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="Arranged By Host">Arranged By Host</option>
                          <option value="Arranged By WCM">Arranged By WCM</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Attendance Section */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <ClipboardList className="h-4.5 w-4.5" />
                      2. Attendance Record
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Meeting Date *</label>
                        <input
                          type="date"
                          required
                          value={editAForm.date || ""}
                          onChange={(e) => setEditAForm({ ...editAForm, date: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Location *</label>
                        <input
                          type="text"
                          required
                          value={editAForm.location || ""}
                          onChange={(e) => setEditAForm({ ...editAForm, location: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Field Executer</label>
                        <input
                          type="text"
                          value={editAForm.fieldExecuter || ""}
                          onChange={(e) => setEditAForm({ ...editAForm, fieldExecuter: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Coordinator Name</label>
                        <input
                          type="text"
                          value={editAForm.coordinator || ""}
                          onChange={(e) => setEditAForm({ ...editAForm, coordinator: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Members Attended</label>
                        <input
                          type="number"
                          value={editAForm.membersAttended ?? 0}
                          onChange={(e) => setEditAForm({ ...editAForm, membersAttended: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pastors Attended</label>
                        <input
                          type="number"
                          value={editAForm.pastorsAttended ?? 0}
                          onChange={(e) => setEditAForm({ ...editAForm, pastorsAttended: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Attendance Remarks</label>
                        <textarea
                          rows={2}
                          value={editAForm.remarks || ""}
                          onChange={(e) => setEditAForm({ ...editAForm, remarks: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. After Meeting Section */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <FileSpreadsheet className="h-4.5 w-4.5" />
                      3. After Meeting Review
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Overall Outcome *</label>
                        <textarea
                          rows={2}
                          required
                          value={editRForm.overallMeetingOutcome || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, overallMeetingOutcome: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Congregation Response *</label>
                        <textarea
                          rows={2}
                          required
                          value={editRForm.congregationResponse || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, congregationResponse: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Coordinator Name</label>
                        <input
                          type="text"
                          value={editRForm.coordinatorName || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, coordinatorName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Designation</label>
                        <input
                          type="text"
                          value={editRForm.designation || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, designation: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">WCM Followers Count</label>
                        <input
                          type="number"
                          value={editRForm.followingWcmMembersCount ?? 0}
                          onChange={(e) => setEditRForm({ ...editRForm, followingWcmMembersCount: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Signature</label>
                        <input
                          type="text"
                          value={editRForm.signature || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, signature: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Strengths Observed</label>
                        <textarea
                          rows={2}
                          value={editRForm.strengthsObserved || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, strengthsObserved: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Challenges Observed</label>
                        <textarea
                          rows={2}
                          value={editRForm.challengesObserved || ""}
                          onChange={(e) => setEditRForm({ ...editRForm, challengesObserved: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Edit Form Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingReport(false)}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingReport}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.98] transition-all"
                    >
                      <Save className="h-4 w-4" />
                      {savingReport ? "Saving Changes..." : "Save Report Changes"}
                    </button>
                  </div>
                </form>
              ) : reportDetail ? (
                <>
                  {/* Verification Sheet Section */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <FileText className="h-4.5 w-4.5" />
                      1. Verification Sheet
                    </h4>
                    {reportDetail.verification ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-5 text-xs font-semibold animate-fadeIn">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Convener Name</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.verification.convenerName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Church / Ministry Name</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.verification.churchMinistryName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">State / District / City</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.verification.stateDistrictCity || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Contact Number</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.verification.contactNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Meeting Dates</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.verification.meetingDates || "N/A"} ({reportDetail.verification.numberOfDays || 0} Days)</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Expected Attendance</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.verification.expectedAttendance || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Ministry Background</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            Years: {reportDetail.verification.yearsOfMinistry || 0} | Members: {reportDetail.verification.churchMembers || 0} | Leaders: {reportDetail.verification.workersLeaders || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Arrangements & Volunteers</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            Hall: {reportDetail.verification.meetingHallStage || "N/A"} | Sound: {reportDetail.verification.soundSystem || "N/A"} | Accomm: {reportDetail.verification.accommodationTeam || "N/A"} | Volunteers: {reportDetail.verification.volunteerSupport || "N/A"}
                          </p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">WCM Connection & Background</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            Known via: {reportDetail.verification.knowAboutWcm || "N/A"} | Read WCM Books: {reportDetail.verification.readWcmBooks ? "Yes" : "No"} | Attended Prophet's Meeting: {reportDetail.verification.attendedProphetMeeting ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No verification details recorded.</p>
                    )}
                  </div>

                  {/* Attendance Section */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <ClipboardList className="h-4.5 w-4.5" />
                      2. Attendance Details
                    </h4>
                    {reportDetail.attendance ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-5 text-xs font-semibold animate-fadeIn">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Date</p>
                          <p className="font-bold text-slate-805 dark:text-white">{new Date(reportDetail.attendance.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Location</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.attendance.location}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Field Executer / Coordinator</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            Executer: {reportDetail.attendance.fieldExecuter} | Coordinator: {reportDetail.attendance.coordinator}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Attendance statistics</p>
                          <p className="font-bold text-slate-805 dark:text-white">
                            Members: {reportDetail.attendance.membersAttended} | Pastors: {reportDetail.attendance.pastorsAttended}
                          </p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Remarks</p>
                          <p className="font-bold text-slate-800 dark:text-white whitespace-pre-wrap leading-relaxed">{reportDetail.attendance.remarks}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No attendance record matches.</p>
                    )}
                  </div>

                  {/* After Meeting Section */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-black text-purple-650 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <FileSpreadsheet className="h-4.5 w-4.5" />
                      3. After Meeting Review
                    </h4>
                    {reportDetail.report ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-955/20 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-5 text-xs font-semibold animate-fadeIn">
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Remarks / Outcome</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.report.overallMeetingOutcome}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Congregation Response</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.report.congregationResponse}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Fellowship / Opportunities</p>
                          <p className="font-bold text-slate-805 dark:text-white">
                            Fellowship: {reportDetail.report.continueFellowship ? "Yes" : "No"} | Ops: {reportDetail.report.futureOpportunities?.join(", ") || "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Coordinator Name & Designation</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {reportDetail.report.coordinatorName} ({reportDetail.report.designation})
                          </p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Strengths Observed</p>
                          <p className="font-bold text-slate-800 dark:text-white whitespace-pre-wrap leading-relaxed">{reportDetail.report.strengthsObserved}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Challenges Observed</p>
                          <p className="font-bold text-slate-800 dark:text-white whitespace-pre-wrap leading-relaxed">{reportDetail.report.challengesObserved}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Opportunity for WCM</p>
                          <p className="font-bold text-slate-800 dark:text-white whitespace-pre-wrap leading-relaxed">{reportDetail.report.opportunityForWcm}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">WCM Followers Count</p>
                          <p className="font-bold text-slate-800 dark:text-white">{reportDetail.report.followingWcmMembersCount || 0}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No after meeting report submitted yet.</p>
                    )}
                  </div>

                  {/* Audit Trails */}
                  <div className="space-y-3">
                    <h4 className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Activity Log / Audit Trail</h4>
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

                  {/* Review / Comments History Log */}
                  {reportDetail.reviewerComments && reportDetail.reviewerComments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Previous Review Feedback History</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {reportDetail.reviewerComments.map((com: any) => (
                          <div key={com.id} className="p-3 bg-amber-50/20 dark:bg-amber-955/5 border border-amber-250/20 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-slate-350 text-left">
                            <p className="italic font-medium leading-relaxed">"{com.comment}"</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Feedback from {com.reviewer?.name || com.reviewer?.username} ({com.reviewer?.role?.replace(/_/g, " ")}) on {new Date(com.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Panel for ZONE_LEADER */}
                  {reportDetail.rawStatus === "ZONE_LEADER_REVIEW" && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">Zone Review Decisions Panel</h4>
                      
                      <div className="space-y-2.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1">
                          Review Feedback Comments (Required if returning for changes or rejecting)
                        </label>
                        <textarea
                          rows={3}
                          value={reviewFeedback}
                          onChange={(e) => setReviewFeedback(e.target.value)}
                          placeholder="e.g. Please clarify convener contact number..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-905 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-550 transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-455 dark:text-slate-405 mb-1.5">
                          Forward Report To (Approval Destination) *
                        </label>
                        <div className="flex flex-wrap gap-4 items-center bg-slate-50/60 dark:bg-slate-950 border border-slate-150 dark:border-slate-808/80 rounded-xl p-3">
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="forwardTo"
                              value="BOTH"
                              checked={forwardTo === "BOTH"}
                              onChange={() => setForwardTo("BOTH")}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Both (State Leader & Admin)
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="forwardTo"
                              value="STATE_LEADER"
                              checked={forwardTo === "STATE_LEADER"}
                              onChange={() => setForwardTo("STATE_LEADER")}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            State Leader Only
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="forwardTo"
                              value="ADMIN"
                              checked={forwardTo === "ADMIN"}
                              onChange={() => setForwardTo("ADMIN")}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Admin Directly
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
                        <button
                          onClick={() => handleReviewSubmit("REJECT")}
                          disabled={submitting}
                          className="px-5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 dark:border-red-900/35 dark:hover:bg-red-950/20 text-xs font-bold uppercase tracking-wider text-red-500 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] text-center"
                        >
                          Reject Report
                        </button>
                        <button
                          onClick={() => handleReviewSubmit("REQUEST_CHANGES")}
                          disabled={submitting}
                          className="px-5 py-2.5 rounded-xl border border-amber-200 hover:bg-amber-50 dark:border-amber-900/35 dark:hover:bg-amber-955/10 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] text-center"
                        >
                          Request Changes
                        </button>
                        <button
                          onClick={() => handleReviewSubmit("APPROVE")}
                          disabled={submitting}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.98] text-center"
                        >
                          Approve & Forward
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {!isEditingReport && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedReportId(null);
                    setReportDetail(null);
                    setReviewFeedback("");
                  }}
                  className="rounded-xl border border-slate-250 dark:border-slate-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Review Confirmation Request */}
      {showConfirmModal && selectedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto animate-modal my-auto">
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-3 mb-4">
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
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-655 dark:hover:text-slate-205 cursor-pointer"
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
                  <span className="font-bold text-slate-805 dark:text-white">{selectedConfirm.location}</span>
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
                  <p className="mt-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-350 italic font-semibold leading-relaxed">
                    "{selectedConfirm.message}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-405 mb-1.5">
                  Feedback / Comments for the Leader
                </label>
                <textarea
                  rows={3}
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="e.g. Approved. Please ensure sound system arrangements are complete."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-905 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-555 transition-all font-semibold"
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
                  className="rounded-xl border border-slate-250 dark:border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-605 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    className="rounded-xl bg-blue-600 hover:bg-blue-750 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.98] transition-all"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Report Modal for Action Column */}
      {sendModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-6 text-left relative max-h-[90vh] overflow-y-auto my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Send / Forward Report
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Report ID: <span className="font-bold text-blue-600 dark:text-blue-400">{sendModalReport.reportId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSendModalReport(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Destination Selection */}
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Recipient Destination *
              </label>
              
              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: BOTH */}
                <div
                  onClick={() => setSendDestination("BOTH")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    sendDestination === "BOTH"
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="sendDestination"
                    checked={sendDestination === "BOTH"}
                    onChange={() => setSendDestination("BOTH")}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Both (State Leader & Admin)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Sends the report to both State Leader and Admin simultaneously for instant review.
                    </div>
                  </div>
                </div>

                {/* Option 2: STATE_LEADER */}
                <div
                  onClick={() => setSendDestination("STATE_LEADER")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    sendDestination === "STATE_LEADER"
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="sendDestination"
                    checked={sendDestination === "STATE_LEADER"}
                    onChange={() => setSendDestination("STATE_LEADER")}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      State Leader Only
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Forwards report specifically to the State Leader for regional review.
                    </div>
                  </div>
                </div>

                {/* Option 3: ADMIN */}
                <div
                  onClick={() => setSendDestination("ADMIN")}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    sendDestination === "ADMIN"
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="sendDestination"
                    checked={sendDestination === "ADMIN"}
                    onChange={() => setSendDestination("ADMIN")}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Admin Directly
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Bypasses state review and sends directly to System Admin for final approval.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Forwarding Notes / Comments (Optional)
              </label>
              <textarea
                rows={2}
                value={sendComment}
                onChange={(e) => setSendComment(e.target.value)}
                placeholder="Add any notes for the recipient leaders..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 px-4 py-2.5 text-xs text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSendModalReport(null)}
                disabled={sendSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendReport}
                disabled={sendSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
