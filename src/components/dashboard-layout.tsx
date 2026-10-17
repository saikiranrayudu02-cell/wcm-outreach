"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { 
  Menu, X, LogOut, LayoutDashboard, FileCheck, Users, 
  FileSpreadsheet, ClipboardList, Sun, Moon, ShieldAlert,
  Bell, CheckCheck, CalendarCheck, User as UserIcon, Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, user, setUser, language, setLanguage } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

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
      await authClient.signOut();
      setUser(null);
      toast.success("Successfully logged out");
      router.push("/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
            <div className="absolute inset-0 rounded-2xl animate-pulseGlow" />
          </div>
          <p className="text-sm font-bold text-indigo-200/70 tracking-widest uppercase animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || "COORDINATOR";

  const getSidebarLinks = () => {
    if (role === "ADMIN") {
      return [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Find People", href: "/find-people", icon: Users },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else if (role === "STATE_LEADER") {
      return [
        { name: "Dashboard", href: "/state-leader/dashboard", icon: LayoutDashboard },
        { name: "Find People", href: "/find-people", icon: Users },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else if (role === "ZONE_LEADER") {
      return [
        { name: "Dashboard", href: "/zone-leader/dashboard", icon: LayoutDashboard },
        { name: "Find People", href: "/find-people", icon: Users },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else if (role === "COORDINATOR" || role === "LEADER") {
      return [
        { name: "Dashboard", href: "/coordinator/dashboard", icon: LayoutDashboard },
        { name: "Confirmations", href: "/coordinator/confirmations", icon: CalendarCheck },
        { name: "My Profile", href: "/profile", icon: UserIcon },
      ];
    } else {
      return [];
    }
  };

  const links = getSidebarLinks();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex min-h-screen font-sans w-full max-w-full overflow-x-clip">
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 hidden w-65 text-white transition-transform duration-300 md:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Logo Section */}
            <div className="flex h-18 items-center px-6 gap-3 border-b border-white/5">
              <div className="relative">
                <img src="/wcm-logo.png" alt="WCM Logo" className="h-9 w-auto object-contain rounded-xl" style={{ filter: "drop-shadow(0 2px 8px rgba(129,140,248,0.3))" }} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider text-white uppercase">WCM</span>
                <span className="text-[9px] font-semibold tracking-widest text-indigo-300/50 uppercase">Outreach</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1 px-3 py-6">
              {links.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(link.href);
                    }}
                    className={`relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 group ${
                      active 
                        ? "bg-white/10 text-white shadow-sm backdrop-blur-sm" 
                        : "text-indigo-200/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-0.75 rounded-r-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></span>
                    )}
                    <Icon className={`h-4.5 w-4.5 transition-all ${active ? "text-indigo-300" : "text-indigo-300/40 group-hover:text-indigo-300/70"}`} />
                    {translate(link.name, language)}
                    {active && <ChevronRight className="h-3 w-3 ml-auto text-indigo-300/50" />}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* User profile & logout info at bottom of sidebar */}
          <div className="border-t border-white/5 p-3">
            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-3 mb-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5 hover:border-indigo-400/20 transition-all text-left cursor-pointer group"
              title="View and edit your profile"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-10 w-10 rounded-xl object-cover border border-indigo-400/20 group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 group-hover:scale-105 transition-transform"
                  style={{ background: "var(--gradient-accent)", color: "#fff" }}
                >
                  {user?.username?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{user?.name || user?.username}</p>
                <p className="text-[9px] text-indigo-300/40 font-semibold uppercase tracking-wider mt-0.5">{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border border-red-500/10 hover:border-red-500"
            >
              <LogOut className="h-4 w-4" />
              {translate("Logout", language)}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div className={`fixed inset-0 z-30 md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-70 max-w-[85vw] text-white p-4 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col justify-between`}
          style={{ background: "var(--gradient-sidebar)" }}
        >
          <div>
            <div className="flex h-12 items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2.5">
                <img src="/wcm-logo.png" alt="WCM Logo" className="h-8 w-auto object-contain rounded-xl" style={{ filter: "drop-shadow(0 2px 8px rgba(129,140,248,0.3))" }} />
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-wider text-white">WCM</span>
                  <span className="text-[9px] font-semibold tracking-widest text-indigo-300/50 uppercase">Outreach</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-indigo-200/50 hover:text-white cursor-pointer p-1 rounded-xl hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {links.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileOpen(false);
                      router.push(link.href);
                    }}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                      active ? "bg-white/10 text-white" : "text-indigo-200/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${active ? "text-indigo-300" : "text-indigo-300/40"}`} />
                    {translate(link.name, language)}
                  </a>
                );
              })}
            </nav>
          </div>
          
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => {
                setMobileOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-3 mb-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-left cursor-pointer"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-10 w-10 rounded-xl object-cover border border-indigo-400/20 shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold uppercase text-sm shrink-0"
                  style={{ background: "var(--gradient-accent)", color: "#fff" }}
                >
                  {user?.username?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || user?.username}</p>
                <p className="text-[9px] text-indigo-300/40 font-semibold uppercase tracking-wider mt-0.5">{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-400 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border border-red-500/10 cursor-pointer hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="h-4 w-4" />
              {translate("Logout", language)}
            </button>
          </div>
        </aside>
      </div>

      {/* Main Container */}
      <div className={`flex flex-col flex-1 min-w-0 max-w-full w-full transition-all duration-300 ${sidebarOpen ? "md:pl-65" : ""}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/50 glass px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileOpen(true);
                } else {
                  toggleSidebar();
                }
              }}
              className="text-foreground/50 hover:text-foreground rounded-xl p-2 hover:bg-accent/80 transition-all cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img src="/wcm-logo.png" alt="WCM Logo" className="h-7 w-auto object-contain rounded-lg" style={{ filter: "drop-shadow(0 1px 4px rgba(99,102,241,0.2))" }} />
              <h1 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground/70 hidden sm:block">
                WCM Reporting
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative rounded-xl p-2 text-foreground/50 hover:bg-accent/80 hover:text-primary transition-all focus:outline-none cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 border border-white dark:border-[#0f0e2a]"></span>
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
                  <div className="absolute -right-12 sm:right-0 mt-2 z-50 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl border border-border/50 glass-card p-4 animate-slideDown text-left" style={{ boxShadow: "var(--shadow-float)" }}>
                    <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-2">
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                        Notifications ({notifications.filter(n => !n.read).length} unread)
                      </span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-border/30 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-foreground/40 font-medium italic">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              if (!n.read) markAsRead(n.id);
                            }}
                            className={`py-3 px-2 flex flex-col gap-1 rounded-xl transition-all cursor-pointer text-left ${
                              n.read 
                                ? "hover:bg-accent/50" 
                                : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary pl-2"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-bold ${!n.read ? "text-primary" : "text-foreground"}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-foreground/30 font-mono whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-foreground/60 line-clamp-3 font-medium">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-foreground/30 font-semibold mt-1">
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
              className="rounded-xl border border-border/50 bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground/70 hover:bg-accent/80 transition-all focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="te">TE</option>
            </select>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="rounded-xl p-2 text-foreground/50 hover:bg-accent/80 hover:text-primary transition-all cursor-pointer"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Profile info on Navbar */}
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 sm:gap-2.5 sm:border-l sm:border-border/50 sm:pl-3 hover:opacity-85 transition-opacity cursor-pointer text-left group"
              title="Click to view and edit profile"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-8 w-8 sm:h-8 sm:w-8 rounded-xl object-cover border border-primary/20 group-hover:scale-105 transition-transform shrink-0 shadow-sm"
                />
              ) : (
                <div className="h-8 w-8 sm:h-8 sm:w-8 rounded-xl font-black text-xs flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-sm text-white"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-foreground/80 block leading-tight group-hover:text-primary transition-colors">
                  {user?.name || user?.username}
                </span>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider inline-block">
                  {user?.role}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Notification Bottom Sheet Modal */}
        {showNotifDropdown && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowNotifDropdown(false)}
            />
            <div className="relative w-full rounded-t-3xl bg-card border-t border-border/50 shadow-2xl p-4 max-h-[82vh] flex flex-col pb-safe animate-sheetSlideUp z-50 text-left">
              <div className="h-1 w-10 rounded-full bg-foreground/10 mx-auto mb-3 shrink-0" />
              <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Notifications ({notifications.filter(n => !n.read).length} unread)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifDropdown(false)}
                    className="p-1 rounded-lg text-foreground/40 hover:text-foreground cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-border/30 space-y-1 pr-1 flex-1">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-foreground/40 font-medium italic">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                      }}
                      className={`py-3 px-2 flex flex-col gap-1 rounded-xl transition-colors cursor-pointer text-left ${
                        n.read 
                          ? "hover:bg-accent/50" 
                          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary pl-2"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs font-bold ${!n.read ? "text-primary" : "text-foreground"}`}>
                          {n.title}
                        </span>
                        <span className="text-[9px] text-foreground/30 font-mono whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/60 line-clamp-3 font-medium">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-foreground/30 font-semibold mt-1">
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
        <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto animate-slideUp pb-24 md:pb-8 min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 border-t border-border/30 text-center text-[10px] uppercase font-semibold tracking-widest text-foreground/25 mb-16 md:mb-0">
          &copy; {new Date().getFullYear()} WCM Ministry. All rights reserved.
        </footer>

        {/* Native Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-border/30 glass px-2 py-1.5 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <button
                key={link.name}
                onClick={() => router.push(link.href)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer min-h-11 min-w-14 active-press ${
                  active 
                    ? "text-primary font-bold" 
                    : "text-foreground/40 font-medium hover:text-foreground/70"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-primary/10 shadow-sm" : ""}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider leading-none">
                  {translate(link.name, language)}
                </span>
              </button>
            );
          })}

          {/* Quick Notifications Button in Mobile Bottom Bar */}
          <button
            onClick={() => setShowNotifDropdown(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer min-h-11 min-w-14 active-press text-foreground/40 font-medium hover:text-foreground/70"
          >
            <div className="relative p-1.5 rounded-xl">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black text-white shadow-sm"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider leading-none">
              Notifs
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
