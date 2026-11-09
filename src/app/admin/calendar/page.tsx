"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { 
  Calendar as CalendarIcon, RefreshCw, PhoneCall, ShieldCheck, 
  ArrowLeft, CheckCircle2, Clock, CalendarDays, Search,
  Sparkles, Layers
} from "lucide-react";
import { toast } from "sonner";
import { CompletedVerificationsCalendar } from "@/components/completed-verifications-calendar";

export default function AdminCalendarPage() {
  const router = useRouter();
  const { user } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/verifications/completed?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Unauthorized: Admin access required.");
          router.push("/login");
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setVerifications(data.verifications || []);
    } catch (err) {
      toast.error("Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerifications();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Meeting & Booking Calendar
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                    Live Bookings
                  </span>
                </div>
                <p className="text-xs text-foreground/50 font-medium">
                  Interactive schedule for confirmed and on-hold outreach meeting bookings, travel modes, sessions, and stay locations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchVerifications()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/80 text-foreground/70 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => router.push("/admin/completed-verifications")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/80 text-foreground/70 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Verifications List
            </button>
            <button
              onClick={() => router.push("/admin/calling-center")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md hover:opacity-95"
              style={{ background: "var(--gradient-accent)" }}
            >
              <PhoneCall className="h-4 w-4" />
              AI Calling Center
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 rounded-2xl border border-border/50 glass-card">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings by client name, church, city, travel mode, or stay location..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border/50 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </form>
        </div>

        {/* Interactive Calendar Component */}
        <CompletedVerificationsCalendar
          verifications={verifications}
          loading={loading}
          canEdit={true}
        />
      </div>
    </DashboardLayout>
  );
}

