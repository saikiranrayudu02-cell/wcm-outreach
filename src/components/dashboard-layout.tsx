"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate, formatRoleName, formatRoleBadge } from "@/lib/translations";
import { 
  Menu, X, LogOut, LayoutDashboard, FileCheck, Users, 
  FileSpreadsheet, ClipboardList, Sun, Moon,
  Bell, CheckCheck, CalendarCheck, Calendar, Inbox, User as UserIcon, ChevronRight, ChevronDown,
  ShieldCheck, PhoneCall, Mail, BarChart3, LayoutGrid, Layers, Download, History
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
  const [loading, setLoading] = useState(true);
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

  // Fetch session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data: session } = await authClient.getSession();
      if (!session) {
        toast.error("Please login to access the system");
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };
    checkSession();
  }, [router, setUser]);

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
                              <a
                                key={sub.name}
                                href={sub.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  router.push(sub.href);
                                }}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                                  subActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                }`}
                              >
                                <SubIcon className={`h-3.5 w-3.5 ${subActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="truncate">{translate(sub.name, language)}</span>
                              </a>
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
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(link.href);
                      }}
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
                    </a>
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
        <aside className={`absolute inset-y-0 left-0 w-70 max-w-[85vw] bg-sidebar text-sidebar-foreground border-r border-border p-4 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col justify-between`}>
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
                              <a
                                key={sub.name}
                                href={sub.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setMobileOpen(false);
                                  router.push(sub.href);
                                }}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                                  subActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                }`}
                              >
                                <SubIcon className={`h-3.5 w-3.5 ${subActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="truncate">{translate(sub.name, language)}</span>
                              </a>
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
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileOpen(false);
                        router.push(link.href);
                      }}
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
                    </a>
                  </div>
                );
              })}
            </nav>
          </div>
          
          <div className="border-t border-border pt-3 space-y-2 shrink-0">
            <button
              onClick={() => {
                setMobileOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-2.5 p-2 rounded-xl bg-accent/40 hover:bg-accent border border-border text-left cursor-pointer transition-all"
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
            </button>
            {!isStandalone && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  installApp();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white px-3 py-2 text-xs font-semibold cursor-pointer active:scale-98 transition-all shadow-xs min-h-10"
              >
                <Download className="h-3.5 w-3.5" />
                Download App
              </button>
            )}
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowLogoutConfirmModal(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-2 text-xs font-semibold border border-red-500/20 cursor-pointer active:scale-98 transition-all min-h-10"
            >
              <LogOut className="h-3.5 w-3.5" />
              {translate("Logout", language)}
            </button>
          </div>
        </aside>
      </div>

      {/* Main Container */}
      <div className={`flex flex-col flex-1 min-w-0 max-w-full w-full transition-all duration-300 ${sidebarOpen ? "md:pl-65" : ""}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileOpen(true);
                } else {
                  toggleSidebar();
                }
              }}
              className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-accent transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/wcm-logo.png" alt="WCM Logo" className="h-6 w-auto object-contain rounded-md" />
              <h1 className="text-xs font-bold tracking-wide text-foreground hidden sm:block">
                WCM Reporting
              </h1>
            </div>

            {/* Mobile Collapsible Features Trigger Button */}
            <button
              onClick={() => setMobileFeaturesOpen((prev) => !prev)}
              className={`md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer active:scale-95 shrink-0 ${
                mobileFeaturesOpen
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-card border-border text-foreground hover:bg-accent"
              }`}
              title="Toggle Features Panel"
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              <span>Features</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${mobileFeaturesOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus:outline-none cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifDropdown(false)}
                  />
                  <div className="absolute -right-12 sm:right-0 mt-2 z-50 w-[calc(100vw-24px)] max-w-sm sm:w-88 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-4 animate-slideDown text-left">
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

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="te">TE</option>
            </select>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Profile & Actions Dropdown Menu on Navbar */}
            <div className="relative sm:border-l sm:border-border sm:pl-2.5">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors cursor-pointer text-left group"
                title="Account menu"
                aria-label="Account menu"
                aria-expanded={showUserMenu}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user?.name || user?.username || "Avatar"}
                    className="h-7 w-7 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 bg-primary text-white">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="hidden sm:block">
                  <span className="text-xs font-semibold text-foreground block leading-tight">
                    {user?.name || user?.username}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                    {formatRoleName(user?.role)}
                  </span>
                </div>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 hidden sm:block ${showUserMenu ? "rotate-180" : ""}`} />
              </button>

              {/* User Dropdown Popover */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-3 animate-slideDown text-left">
                    {/* User Info Header */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-accent/50 mb-2">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt={user?.name || user?.username || "Avatar"}
                          className="h-8 w-8 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 bg-primary text-white">
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{user?.name || user?.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{user?.username}</p>
                        <span className="text-[9px] text-primary font-semibold uppercase tracking-wider inline-block">
                          {formatRoleName(user?.role)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
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
                          <span>Download / Install App</span>
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
        </header>

        {/* Mobile Collapsible Top Features Panel */}
        <div
          className={`md:hidden border-b border-border bg-card transition-all duration-300 ease-in-out ${
            mobileFeaturesOpen
              ? "max-h-[85vh] opacity-100 py-3.5 px-3 overflow-y-auto shadow-lg"
              : "max-h-0 opacity-0 py-0 px-3 overflow-hidden pointer-events-none border-b-0"
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {translate("Navigation & Features", language)}
              </span>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {formatRoleName(user?.role)}
              </span>
            </div>
            <button
              onClick={() => setMobileFeaturesOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
              title="Close Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {links.map((link: any) => {
              const active = isLinkActive(link.href);
              const Icon = link.icon;
              if (link.subItems) {
                return (
                  <div key={link.name} className="col-span-2 sm:col-span-3 space-y-1.5 p-2 rounded-xl bg-accent/40 border border-border">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block px-1">
                      {translate(link.name, language)}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {link.subItems.map((sub: any) => {
                        const subActive = isLinkActive(sub.href);
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.name}
                            onClick={() => {
                              setMobileFeaturesOpen(false);
                              router.push(sub.href);
                            }}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer active:scale-95 ${
                              subActive
                                ? "bg-primary text-white border-primary shadow-xs font-semibold"
                                : "bg-card border-border text-foreground hover:bg-accent"
                            }`}
                          >
                            <SubIcon className={`h-3.5 w-3.5 shrink-0 ${subActive ? "text-white" : "text-primary"}`} />
                            <span className="text-[11px] font-medium tracking-wide truncate">
                              {translate(sub.name, language)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={link.name}
                  onClick={() => {
                    setMobileFeaturesOpen(false);
                    router.push(link.href);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                    active
                      ? "bg-primary text-white border-primary shadow-xs font-semibold"
                      : "bg-card border-border text-foreground hover:bg-accent"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-medium tracking-wide block truncate">
                      {translate(link.name, language)}
                    </span>
                    {link.badge && (
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                        active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {!isStandalone && (
              <button
                onClick={() => {
                  setMobileFeaturesOpen(false);
                  installApp();
                }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all min-h-10 shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>Download / Install App</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileFeaturesOpen(false);
                  router.push("/profile");
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-semibold transition-all min-h-10 cursor-pointer"
              >
                <UserIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{translate("My Profile", language)}</span>
              </button>
              <button
                onClick={() => {
                  setMobileFeaturesOpen(false);
                  setShowLogoutConfirmModal(true);
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-semibold transition-all min-h-10 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>{translate("Logout", language)}</span>
              </button>
            </div>
          </div>
        </div>

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
        <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto animate-slideUp pb-8 min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 border-t border-border text-center text-[11px] font-medium text-muted-foreground mb-0">
          &copy; {new Date().getFullYear()} WCM Outreach Platform. All rights reserved.
        </footer>
      </div>

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
