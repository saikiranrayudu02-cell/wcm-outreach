"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate, formatRoleName, formatRoleBadge } from "@/lib/translations";
import { RoleBadge } from "@/components/role-badge";
import { 
  Menu, X, LogOut, LayoutDashboard, FileCheck, Users, 
  FileSpreadsheet, ClipboardList, Sun, Moon,
  Bell, CheckCheck, CalendarCheck, Calendar, Inbox, User as UserIcon, ChevronRight, ChevronDown,
  ShieldCheck, PhoneCall, Mail, BarChart3, LayoutGrid, Layers, Download, History, ArrowLeft, Globe
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { usePwa } from "@/components/pwa-provider";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase animate-pulse">Loading...</p>
        </div>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sidebarOpen, toggleSidebar, user, setUser, language, setLanguage } = useUIStore();
  const { theme, setTheme } = useTheme();
  const { isStandalone, installApp } = usePwa();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Instant non-blocking loading: if user is cached in UI store, render immediately with 0 delay!
  const [loading, setLoading] = useState(!user);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [afterMeetingOpen, setAfterMeetingOpen] = useState(
    pathname.includes("/coordinator/attendance") || pathname.includes("/coordinator/after-meeting")
  );

  useEffect(() => {
    setMobileFeaturesOpen(false);
    setMobileOpen(false);
    setShowUserMenu(false);
  }, [pathname, searchParams]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/all/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  // Non-blocking background session verification
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (!isMounted) return;
        if (!session) {
          if (!user) {
            toast.error("Please login to access the system");
            router.push("/login");
          }
        } else {
          setUser(session.user);
        }
      } catch (err) {
        console.warn("Session check error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [router, setUser, user]);

  // Fetch notifications on load or when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      setUser(null);
      toast.success("Successfully logged out");
      setShowLogoutConfirmModal(false);
      router.push("/login");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || "COORDINATOR";

  const getSidebarLinks = () => {
    if (role === "ADMIN") {
      return [
        { name: "Calendar", href: "/admin/calendar", icon: Calendar, sectionHeader: "Schedule & Bookings", badge: "Live" },
        { name: "Previous Meeting Preview", href: "/admin/previous-meetings", icon: History, sectionHeader: "History & Tracking", badge: "New" },
        { name: "Meeting Management", href: "/admin/meetings", icon: Layers, sectionHeader: "Administration", badge: "New" },
        { name: "User Management", href: "/admin/dashboard?tab=users", icon: Users },
        { name: "Submitted Reports", href: "/admin/dashboard?tab=reports", icon: FileSpreadsheet },
        { name: "Monthly Summary", href: "/admin/dashboard?tab=analytics", icon: BarChart3 },
        { name: "Send Messages", href: "/admin/dashboard?tab=messages", icon: Mail },
        { name: "Confirmations", href: "/admin/dashboard?tab=confirmations", icon: CalendarCheck },
        { name: "Completed Verifications", href: "/admin/completed-verifications", icon: ShieldCheck, sectionHeader: "Outreach & AI" },
        { name: "AI Calling Center", href: "/admin/calling-center", icon: PhoneCall, badge: "Voice AI" },
        { name: "Find People", href: "/find-people", icon: Users, sectionHeader: "Tools" },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else if (role === "STATE_LEADER") {
      return [
        { name: "Dashboard", href: "/state-leader/dashboard", icon: LayoutDashboard },
        { name: "Assigned Meetings", href: "/state-leader/assigned-meetings", icon: CalendarCheck, badge: "New" },
        { name: "Find People", href: "/find-people", icon: Users },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else if (role === "ZONE_LEADER") {
      return [
        { name: "Dashboard", href: "/zone-leader/dashboard", icon: LayoutDashboard },
        { name: "Assigned Meetings", href: "/zone-leader/assigned-meetings", icon: CalendarCheck, badge: "New" },
        { name: "Find People", href: "/find-people", icon: Users },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else if (role === "COORDINATOR" || role === "LEADER") {
      return [
        { name: "Dashboard", href: "/coordinator/dashboard", icon: LayoutDashboard },
        { name: "Received Meetings", href: "/coordinator/received-meetings", icon: Inbox, badge: "New" },
        { name: "Verification", href: "/coordinator/verification", icon: FileCheck },
        { 
          name: "After Meeting", 
          href: "/coordinator/attendance", 
          icon: ClipboardList,
          subItems: [
            { name: "Attendance Form", href: "/coordinator/attendance", icon: FileSpreadsheet },
            { name: "After-Meeting Evaluation Form", href: "/coordinator/after-meeting", icon: ClipboardList },
          ]
        },
        { name: "Confirmations", href: "/coordinator/confirmations", icon: CalendarCheck },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else {
      return [];
    }
  };

  const links = getSidebarLinks();

  const getPageTitle = () => {
    if (pathname === "/admin/calendar") return "Outreach Schedule";
    if (pathname === "/admin/calling-center") return "AI Calling Center";
    if (pathname === "/admin/meetings") return "Meeting Management";
    if (pathname === "/admin/previous-meetings") return "Previous Meetings";
    if (pathname === "/admin/completed-verifications") return "Completed Verifications";
    if (pathname === "/admin/dashboard") {
      const tab = searchParams?.get("tab");
      if (tab === "reports") return "Submitted Reports";
      if (tab === "analytics") return "Monthly Summary";
      if (tab === "messages") return "Send Messages";
      if (tab === "confirmations") return "Confirmations";
      return "User Management";
    }
    if (pathname === "/coordinator/dashboard") return "Field Operations";
    if (pathname === "/coordinator/verification") return "Verification Form";
    if (pathname === "/coordinator/attendance") return "Attendance Sheet";
    if (pathname === "/coordinator/after-meeting") return "Evaluation Form";
    if (pathname === "/coordinator/received-meetings") return "Assigned Meetings";
    if (pathname === "/coordinator/confirmations") return "Meeting Confirmations";
    if (pathname?.startsWith("/coordinator/report/")) return "Meeting Report";
    if (pathname === "/state-leader/dashboard") return "State Dashboard";
    if (pathname === "/state-leader/assigned-meetings") return "Assigned Meetings";
    if (pathname === "/zone-leader/dashboard") return "Zonal Dashboard";
    if (pathname === "/zone-leader/assigned-meetings") return "Assigned Meetings";
    if (pathname === "/find-people") return "Find People";
    if (pathname === "/profile") return "My Profile";
    return "WCM Outreach";
  };

  const getBottomNavTabs = () => {
    if (role === "ADMIN") {
      return [
        { name: "Schedule", href: "/admin/calendar", icon: Calendar },
        { name: "Meetings", href: "/admin/meetings", icon: Layers },
        { name: "Reports", href: "/admin/dashboard?tab=reports", icon: FileSpreadsheet },
        { name: "AI Calls", href: "/admin/calling-center", icon: PhoneCall, badge: "AI" },
        { name: "More", isMore: true, icon: Menu },
      ];
    }
    if (role === "COORDINATOR" || role === "LEADER") {
      return [
        { name: "Home", href: "/coordinator/dashboard", icon: LayoutDashboard },
        { name: "Meetings", href: "/coordinator/received-meetings", icon: Inbox },
        { name: "Verify", href: "/coordinator/verification", icon: FileCheck },
        { name: "Attendance", href: "/coordinator/attendance", icon: FileSpreadsheet },
        { name: "More", isMore: true, icon: Menu },
      ];
    }
    if (role === "STATE_LEADER") {
      return [
        { name: "Home", href: "/state-leader/dashboard", icon: LayoutDashboard },
        { name: "Meetings", href: "/state-leader/assigned-meetings", icon: CalendarCheck },
        { name: "People", href: "/find-people", icon: Users },
        { name: "Profile", href: "/profile", icon: UserIcon },
        { name: "More", isMore: true, icon: Menu },
      ];
    }
    // ZONE_LEADER
    return [
      { name: "Home", href: "/zone-leader/dashboard", icon: LayoutDashboard },
      { name: "Meetings", href: "/zone-leader/assigned-meetings", icon: CalendarCheck },
      { name: "People", href: "/find-people", icon: Users },
      { name: "Profile", href: "/profile", icon: UserIcon },
      { name: "More", isMore: true, icon: Menu },
    ];
  };

  const bottomTabs = getBottomNavTabs();

  const isLinkActive = (linkHref: string) => {
    const [linkPath, linkQuery] = linkHref.split("?");
    if (linkQuery) {
      if (pathname !== linkPath) return false;
      const currentTab = searchParams ? searchParams.get("tab") : null;
      const linkTab = new URLSearchParams(linkQuery).get("tab");
      if (linkTab === "users") {
        return !currentTab || currentTab === "users";
      }
      return currentTab === linkTab;
    }
    if (linkHref === "/admin/dashboard") {
      const currentTab = searchParams ? searchParams.get("tab") : null;
      return pathname === "/admin/dashboard" && (!currentTab || currentTab === "users");
    }
    return pathname === linkPath || pathname.startsWith(linkPath + "/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex min-h-screen font-sans w-full max-w-full overflow-x-clip bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 hidden w-65 transition-transform duration-300 md:block bg-sidebar text-sidebar-foreground border-r border-border ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Logo Section */}
            <div className="flex h-16 items-center px-5 gap-3 border-b border-border shrink-0">
              <div className="relative">
                <img src="/wcm-logo.png" alt="WCM Logo" className="h-8 w-auto object-contain rounded-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider text-foreground uppercase">WCM Outreach</span>
                <span className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">Ministry Platform</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4 no-scrollbar">
              {links.map((link: any) => {
                const Icon = link.icon;
                if (link.subItems) {
                  const isSubActive = link.subItems.some((s: any) => isLinkActive(s.href));
                  return (
                    <div key={link.name} className="space-y-1">
                      {link.sectionHeader && (
                        <div className="pt-3 pb-1 px-3 first:pt-0">
                          <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                            {translate(link.sectionHeader, language)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setAfterMeetingOpen((prev) => !prev)}
                        className={`relative flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-medium tracking-wide transition-all duration-150 group cursor-pointer ${
                          isSubActive 
                            ? "bg-accent text-accent-foreground font-semibold" 
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 transition-colors ${isSubActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                          <span>{translate(link.name, language)}</span>
                        </div>
                        {afterMeetingOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {afterMeetingOpen && (
                        <div className="pl-3 space-y-1 pt-0.5 border-l border-border ml-4">
                          {link.subItems.map((sub: any) => {
                            const subActive = isLinkActive(sub.href);
                            const SubIcon = sub.icon;
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                prefetch={true}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                                  subActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                }`}
                              >
                                <SubIcon className={`h-3.5 w-3.5 ${subActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="truncate">{translate(sub.name, language)}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isLinkActive(link.href);
                return (
                  <div key={link.name} className="space-y-1">
                    {link.sectionHeader && (
                      <div className="pt-3 pb-1 px-3 first:pt-0">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                          {translate(link.sectionHeader, language)}
                        </p>
                      </div>
                    )}
                    <Link
                      href={link.href}
                      prefetch={true}
                      className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium tracking-wide transition-all duration-150 group ${
                        active 
                          ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold" 
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-primary"></span>
                      )}
                      <Icon className={`h-4 w-4 transition-colors shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <span className="truncate">{translate(link.name, language)}</span>
                      {link.badge && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {link.badge}
                        </span>
                      )}
                      {active && !link.badge && <ChevronRight className="h-3 w-3 ml-auto text-primary/70 shrink-0" />}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* User profile & actions at bottom of sidebar */}
          <div className="border-t border-border p-3 shrink-0 space-y-2">
            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-2.5 p-2 rounded-xl bg-accent/40 hover:bg-accent border border-border transition-all text-left cursor-pointer group"
              title="View and edit your profile"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-8 w-8 rounded-lg object-cover border border-border shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 bg-primary text-white">
                  {user?.username?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || user?.username}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{formatRoleBadge(user?.role)}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>
            {!isStandalone && (
              <button
                onClick={installApp}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs min-h-9"
              >
                <Download className="h-3.5 w-3.5" />
                Download App
              </button>
            )}
            <button
              onClick={() => setShowLogoutConfirmModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer border border-red-500/20 hover:border-red-500 min-h-9"
            >
              <LogOut className="h-3.5 w-3.5" />
              {translate("Logout", language)}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div className={`fixed inset-0 z-30 md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-70 max-w-[85vw] bg-sidebar text-sidebar-foreground border-r border-border pt-[max(1rem,env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px),var(--safe-area-inset-left,0px))] pr-4 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col justify-between`}>
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex h-12 items-center justify-between mb-4 px-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/wcm-logo.png" alt="WCM Logo" className="h-7 w-auto object-contain rounded-lg" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">WCM Outreach</span>
                  <span className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">Platform</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 pr-1 no-scrollbar">
              {links.map((link: any) => {
                const Icon = link.icon;
                if (link.subItems) {
                  const isSubActive = link.subItems.some((s: any) => isLinkActive(s.href));
                  return (
                    <div key={link.name} className="space-y-1">
                      {link.sectionHeader && (
                        <div className="pt-3 pb-1 px-3 first:pt-0">
                          <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                            {translate(link.sectionHeader, language)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setAfterMeetingOpen((prev) => !prev)}
                        className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium tracking-wide transition-all ${
                          isSubActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isSubActive ? "text-primary" : "text-muted-foreground"}`} />
                          <span>{translate(link.name, language)}</span>
                        </div>
                        {afterMeetingOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {afterMeetingOpen && (
                        <div className="pl-3 space-y-1 pt-0.5 border-l border-border ml-4">
                          {link.subItems.map((sub: any) => {
                            const subActive = isLinkActive(sub.href);
                            const SubIcon = sub.icon;
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                prefetch={true}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                                  subActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                }`}
                              >
                                <SubIcon className={`h-3.5 w-3.5 ${subActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="truncate">{translate(sub.name, language)}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isLinkActive(link.href);
                return (
                  <div key={link.name} className="space-y-1">
                    {link.sectionHeader && (
                      <div className="pt-3 pb-1 px-3 first:pt-0">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                          {translate(link.sectionHeader, language)}
                        </p>
                      </div>
                    )}
                    <Link
                      href={link.href}
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium tracking-wide transition-all ${
                        active ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="truncate">{translate(link.name, language)}</span>
                      {link.badge && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>
          
          {/* Mobile Drawer Bottom User & Action Section */}
          <div className="border-t border-border pt-3 space-y-2.5 shrink-0">
            <div className="p-2.5 rounded-xl bg-accent/40 border border-border/80 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/profile");
                }}
                className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer active:opacity-75 transition-opacity"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user?.name || user?.username || "Avatar"}
                    className="h-8 w-8 rounded-lg object-cover border border-border shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 bg-primary text-white shadow-2xs">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{user?.name || user?.username}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{user?.username}</p>
                </div>
              </button>
              <RoleBadge role={user?.role} size="xs" />
            </div>

            {!isStandalone && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  installApp();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white px-3 py-2 text-xs font-semibold cursor-pointer active:scale-98 transition-all shadow-xs min-h-10"
              >
                <Download className="h-3.5 w-3.5" />
                Install Mobile App
              </button>
            )}

            <button
              onClick={() => {
                setMobileOpen(false);
                setShowLogoutConfirmModal(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider border border-red-500/20 cursor-pointer active:scale-95 transition-all min-h-10 shadow-2xs"
            >
              <LogOut className="h-4 w-4" />
              {translate("Logout", language)}
            </button>
          </div>
        </aside>
      </div>

      {/* Main Container */}
      <div className={`flex flex-col flex-1 min-w-0 max-w-full w-full transition-all duration-300 ${sidebarOpen ? "md:pl-65" : ""}`}>
        {/* Top Navbar with Native Safe-Area Support */}
        <header className="sticky top-0 z-20 flex flex-col justify-end border-b border-border bg-background/95 dark:bg-[#111114]/95 backdrop-blur-xl transition-all duration-200">
          <div className="w-full shrink-0 h-[max(env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px))]" aria-hidden="true" />
          
          {/* Mobile Native App Toolbar (< md) */}
          <div className="flex md:hidden h-13 w-full items-center justify-between px-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img src="/wcm-logo.png" alt="WCM" className="h-7 w-auto object-contain rounded-md shrink-0 shadow-2xs" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black tracking-tight text-foreground truncate max-w-[170px] sm:max-w-xs">
                  {getPageTitle()}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                  {formatRoleName(role)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === "en" ? "te" : "en")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                title="Toggle Language"
              >
                <Globe className="h-3 w-3 text-primary" />
                <span>{language === "en" ? "TE" : "EN"}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-blue-600" />}
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                aria-label="Notifications"
              >
                <Bell className="h-3.5 w-3.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </button>

              {/* User Avatar */}
              <button
                onClick={() => router.push("/profile")}
                className="h-7 w-7 rounded-lg overflow-hidden border border-border shrink-0 active:scale-95 transition-all cursor-pointer"
                aria-label="Profile"
              >
                {user?.image ? (
                  <img src={user.image} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-black text-[11px] uppercase bg-primary text-white">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Toolbar (>= md) */}
          <div className="hidden md:flex h-14 w-full items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleSidebar}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-accent transition-colors cursor-pointer"
                aria-label="Toggle Sidebar"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
              <div className="flex items-center gap-2">
                <img src="/wcm-logo.png" alt="WCM Logo" className="h-6 w-auto object-contain rounded-md" />
                <h1 className="text-xs font-bold tracking-wide text-foreground">
                  WCM Outreach Ministry Platform
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  )}
                </button>

                {/* Desktop Notification Dropdown */}
                {showNotifDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-88 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-4 animate-slideDown text-left">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                        <span className="text-xs font-bold text-foreground">
                          Notifications ({notifications.filter(n => !n.read).length} unread)
                        </span>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-border/50 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-muted-foreground font-medium italic">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                if (!n.read) markAsRead(n.id);
                              }}
                              className={`py-2.5 px-2 flex flex-col gap-1 rounded-lg transition-colors cursor-pointer text-left ${
                                n.read 
                                  ? "hover:bg-accent/60" 
                                  : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary pl-2"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-xs font-semibold ${!n.read ? "text-primary" : "text-foreground"}`}>
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-3">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                                From: {n.sender?.username || "Admin"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Desktop User Menu Popover */}
              <div className="relative sm:border-l sm:border-border sm:pl-2.5">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors cursor-pointer text-left group"
                >
                  {user?.image ? (
                    <img src={user.image} alt={user?.name || user?.username} className="h-7 w-7 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 bg-primary text-white">
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-xs font-bold text-foreground">
                    {user?.name || user?.username}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-3 animate-slideDown text-left">
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-accent/50 mb-2">
                        {user?.image ? (
                          <img src={user.image} alt={user?.name || user?.username} className="h-8 w-8 rounded-lg object-cover border border-border shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 bg-primary text-white">
                            {user?.username?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{user?.name || user?.username}</p>
                          <p className="text-[10px] text-muted-foreground truncate">@{user?.username}</p>
                          <RoleBadge role={user?.role} size="xs" className="mt-1" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        {!isStandalone && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              installApp();
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 shrink-0" />
                            <span>Install Mobile App</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push("/profile");
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                          <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{translate("My Profile", language)}</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground shrink-0" />
                        </button>

                        <div className="h-px bg-border my-1" />

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowLogoutConfirmModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 shrink-0" />
                          <span>{translate("Logout", language)}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>



        {/* Mobile Notification Bottom Sheet Modal */}
        {showNotifDropdown && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowNotifDropdown(false)}
            />
            <div className="relative w-full rounded-t-2xl bg-card border-t border-border shadow-2xl p-4 max-h-[82vh] flex flex-col pb-safe animate-sheetSlideUp z-50 text-left">
              <div className="h-1 w-10 rounded-full bg-border mx-auto mb-3 shrink-0" />
              <div className="flex items-center justify-between border-b border-border pb-3 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Notifications ({notifications.filter(n => !n.read).length} unread)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-semibold text-primary flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifDropdown(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-border/50 space-y-1 pr-1 flex-1">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground font-medium italic">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                      }}
                      className={`py-2.5 px-2 flex flex-col gap-1 rounded-lg transition-colors cursor-pointer text-left ${
                        n.read 
                          ? "hover:bg-accent/60" 
                          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary pl-2"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs font-semibold ${!n.read ? "text-primary" : "text-foreground"}`}>
                          {n.title}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-3">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                        From: {n.sender?.username || "Admin"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto animate-slideUp pb-[calc(5rem+max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px)))] md:pb-10 min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="hidden md:block py-4 border-t border-border text-center text-[11px] font-medium text-muted-foreground mb-0">
          &copy; {new Date().getFullYear()} WCM Outreach Platform. All rights reserved.
        </footer>
      </div>

      {/* Role-Aware Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/95 dark:bg-[#111114]/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] select-none"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1 pb-[max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px))]">
          {bottomTabs.map((tab: any) => {
            const Icon = tab.icon;
            const active = tab.isMore ? mobileOpen : isLinkActive(tab.href);
            const tabContent = (
              <>
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-transform duration-150 ${active ? "scale-110" : ""}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-black rounded-full bg-primary text-white leading-none">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight leading-none truncate max-w-full ${active ? "font-bold text-foreground" : "font-medium"}`}>
                  {tab.name}
                </span>
                {active ? (
                  <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-transparent mt-0.5" />
                )}
              </>
            );

            if (tab.isMore) {
              return (
                <button
                  key={tab.name}
                  onClick={() => setMobileOpen(true)}
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                    active
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tabContent}
                </button>
              );
            }

            return (
              <Link
                key={tab.name}
                href={tab.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                  active
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tabContent}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => !isLoggingOut && setShowLogoutConfirmModal(false)}
          />
          <div 
            className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 text-center animate-scaleIn z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 id="logout-title" className="text-base font-bold text-foreground text-center mb-1.5">
              {translate("Logout", language)}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed text-center mb-6">
              {language === "te" 
                ? "మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా? నివేదికలను యాక్సెస్ చేయడానికి మీరు మళ్లీ సైన్ ఇన్ చేయాలి."
                : language === "hi"
                ? "क्या आप निश्चित रूप से लॉग आउट करना चाहते हैं? रिपोर्ट्स तक पहुंचने के लिए आपको फिर से साइन इन करना होगा।"
                : "Are you sure you want to sign out? You will need to log in again to access reports, forms, and ministry tools."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirmModal(false)}
                className="w-full py-2 px-3 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-semibold transition-colors min-h-10 cursor-pointer disabled:opacity-50"
              >
                {translate("Cancel", language) || "Cancel"}
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors min-h-10 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{translate("Logout", language) || "Sign Out"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
