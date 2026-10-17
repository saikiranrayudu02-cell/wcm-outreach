"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { 
  Menu, X, LogOut, LayoutDashboard, FileCheck, Users, 
  FileSpreadsheet, ClipboardList, Sun, Moon, ShieldAlert,
  Bell, CheckCheck, CalendarCheck, User as UserIcon
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
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-500 tracking-wide animate-pulse">Loading WMLRS...</p>
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 hidden w-64 bg-slate-950 border-r border-slate-900 text-slate-100 transition-transform duration-300 md:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Logo Section */}
            <div className="flex h-16 items-center px-6 border-b border-slate-900 gap-3">
              <img src="/wcm-logo.png" alt="WCM Logo" className="h-8 w-auto object-contain rounded-md bg-black p-1 border border-slate-800" />
              <span className="text-sm font-black tracking-wider text-white uppercase">WCM Outreach</span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5 px-4 py-6">
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
                    className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      active 
                        ? "bg-slate-900 text-white shadow-sm border border-slate-800" 
                        : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-blue-500"></span>
                    )}
                    <Icon className={`h-5 w-5 transition-colors ${active ? "text-blue-500" : "text-slate-400"}`} />
                    {translate(link.name, language)}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* User profile & logout info at bottom of sidebar */}
          <div className="border-t border-slate-900 p-4 bg-slate-950/40">
            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-3 mb-4 p-2 rounded-xl bg-slate-900/35 hover:bg-slate-900/70 border border-slate-900/40 hover:border-slate-800 transition-all text-left cursor-pointer group"
              title="View and edit your profile"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-9 w-9 rounded-xl object-cover border border-blue-500/30 group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/25 flex items-center justify-center font-black text-blue-500 text-sm uppercase shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  {user?.username?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{user?.name || user?.username}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user?.role?.replace(/_/g, " ")}</p>
              </div>
              <span className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {translate("Logout", language)}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div className={`fixed inset-0 z-30 md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-slate-950 border-r border-slate-900 text-slate-100 p-4 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col justify-between`}>
          <div>
            <div className="flex h-12 items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2.5">
                <img src="/wcm-logo.png" alt="WCM Logo" className="h-7 w-auto object-contain rounded-md bg-black p-0.5 border border-slate-800" />
                <span className="text-xs font-black uppercase tracking-wider text-white">WCM OUTREACH</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="h-6 w-6" />
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
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                      active ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-blue-500" : "text-slate-400"}`} />
                    {translate(link.name, language)}
                  </a>
                );
              })}
            </nav>
          </div>
          
          <div className="border-t border-slate-900 pt-4">
            <button
              onClick={() => {
                setMobileOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-3 mb-4 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-left cursor-pointer"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-9 w-9 rounded-xl object-cover border border-blue-500/30 shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 uppercase text-sm shrink-0">
                  {user?.username?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || user?.username}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-red-500/15 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {translate("Logout", language)}
            </button>
          </div>
        </aside>
      </div>

      {/* Main Container */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "md:pl-64" : ""}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileOpen(true);
                } else {
                  toggleSidebar();
                }
              }}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/wcm-logo.png" alt="WCM Logo" className="h-7 w-auto object-contain rounded-md bg-black p-1 border border-slate-800 dark:border-slate-700" />
              <h1 className="text-xs font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-200 hidden sm:block">
                WCM Ministry Reporting System
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors focus:outline-none cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
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
                  <div className="absolute -right-12 sm:right-0 mt-2.5 z-50 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 shadow-2xl p-4 animate-fadeIn text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Notifications ({notifications.filter(n => !n.read).length} unread)
                      </span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium italic">
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
                                ? "hover:bg-slate-50 dark:hover:bg-slate-800/30" 
                                : "bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 border-l-2 border-blue-500 pl-1.5"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-bold text-slate-800 dark:text-white ${!n.read ? "text-blue-600 dark:text-blue-400" : ""}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-medium">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-semibold mt-1">
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
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="te">TE</option>
            </select>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors border border-transparent hover:border-slate-105 dark:hover:border-slate-800 cursor-pointer"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            {/* Profile info on Navbar */}
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 sm:gap-2.5 sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-3 hover:opacity-85 transition-opacity cursor-pointer text-left group"
              title="Click to view and edit profile"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || user?.username || "Avatar"}
                  className="h-8 w-8 sm:h-7 sm:w-7 rounded-xl sm:rounded-lg object-cover border border-blue-500/30 group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="h-8 w-8 sm:h-7 sm:w-7 rounded-xl sm:rounded-lg bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {user?.name || user?.username}
                </span>
                <span className="text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-500/10 px-1.5 py-0.2 rounded font-black uppercase tracking-wider inline-block">
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
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowNotifDropdown(false)}
            />
            <div className="relative w-full rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-4 max-h-[82vh] flex flex-col pb-safe animate-sheetSlideUp z-50 text-left">
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 shrink-0" />
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Notifications ({notifications.filter(n => !n.read).length} unread)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifDropdown(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 space-y-1 pr-1 flex-1">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium italic">
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
                          ? "hover:bg-slate-50 dark:hover:bg-slate-800/30" 
                          : "bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 border-l-2 border-blue-500 pl-1.5"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs font-bold text-slate-800 dark:text-white ${!n.read ? "text-blue-600 dark:text-blue-400" : ""}`}>
                          {n.title}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-medium">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
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
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-slideUp pb-24 md:pb-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 border-t border-slate-200 dark:border-slate-850/50 bg-white dark:bg-slate-950 text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-16 md:mb-0">
          &copy; {new Date().getFullYear()} WCM Ministry. All rights reserved.
        </footer>

        {/* Native Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg px-2 py-1.5 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <button
                key={link.name}
                onClick={() => router.push(link.href)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer min-h-11 min-w-14 active-press ${
                  active 
                    ? "text-blue-600 dark:text-blue-400 font-bold" 
                    : "text-slate-450 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <div className={`p-1 rounded-xl transition-colors ${active ? "bg-blue-50 dark:bg-blue-950/60" : ""}`}>
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
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer min-h-11 min-w-14 active-press text-slate-450 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200"
          >
            <div className="relative p-1 rounded-xl">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-xs">
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
