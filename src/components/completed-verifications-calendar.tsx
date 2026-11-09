"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, Users, Phone, ShieldCheck, CheckCircle2, 
  Clock, AlertCircle, PhoneCall, Eye, X, Sparkles, Building, 
  Layers, Volume2, Home, Check, Sunrise, Sun, Moon, 
  Car, Plane, Train, Bus, Navigation, Hotel, Pencil, ListFilter,
  UserCheck, AlertTriangle, Plus, Trash2, ArrowUpRight, History,
  Search, Filter, CalendarDays, Compass, Bed, CheckCheck, CalendarCheck,
  ArrowRight, Info, SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { MediaViewer } from "@/components/media-viewer";
import { CallAudioPlayer } from "@/components/call-audio-player";

export interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  key: string; // YYYY-MM-DD
}

interface CompletedVerificationsCalendarProps {
  verifications?: any[];
  onSelectRecord?: (record: any) => void;
  onInitiateCall?: (record: any) => void;
  loading?: boolean;
  canEdit?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Status Badge for Confirmed / On Hold / Cancelled
 */
export function BookingStatusBadge({ status }: { status: string }) {
  const norm = status?.toUpperCase();
  if (norm === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        CONFIRMED
      </span>
    );
  }
  if (norm === "ON_HOLD" || norm === "ON HOLD") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        ON HOLD
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30 uppercase tracking-wider shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {status || "CANCELLED"}
    </span>
  );
}

/**
 * Visual badge for session (Morning / Afternoon / Evening)
 */
export function SessionBadge({ session }: { session?: string | null }) {
  const norm = session?.toLowerCase();
  if (norm === "morning") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
        <Sunrise className="h-2.5 w-2.5 text-amber-500 shrink-0" />
        <span>Morning</span>
      </span>
    );
  }
  if (norm === "afternoon") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 shrink-0">
        <Sun className="h-2.5 w-2.5 text-sky-500 shrink-0" />
        <span>Afternoon</span>
      </span>
    );
  }
  if (norm === "evening") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
        <Moon className="h-2.5 w-2.5 text-purple-400 shrink-0" />
        <span>Evening</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-foreground/5 text-foreground/60 border border-border/40 shrink-0">
      <Clock className="h-2.5 w-2.5 shrink-0" />
      <span>{session || "General"}</span>
    </span>
  );
}

/**
 * Travel Mode Icon and Badge
 */
export function TravelModeBadge({ mode, details }: { mode?: string | null; details?: string | null }) {
  const norm = mode?.toLowerCase();
  let Icon = Navigation;
  let colorCls = "bg-primary/10 text-primary border-primary/20";
  if (norm === "car") {
    Icon = Car;
    colorCls = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  } else if (norm === "flight") {
    Icon = Plane;
    colorCls = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
  } else if (norm === "train") {
    Icon = Train;
    colorCls = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  } else if (norm === "bus") {
    Icon = Bus;
    colorCls = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${colorCls}`}>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate max-w-20">{mode || "Travel"}</span>
      {norm === "other" && details && <span className="text-[8px] opacity-75 truncate max-w-16">({details})</span>}
    </span>
  );
}

export function CompletedVerificationsCalendar({
  verifications = [],
  onSelectRecord,
  onInitiateCall,
  loading: externalLoading = false,
  canEdit = true,
}: CompletedVerificationsCalendarProps) {
  const router = useRouter();

  // Calendar View: Month | Week | Agenda
  const [calendarView, setCalendarView] = useState<"month" | "week" | "agenda">("month");

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Bookings from DB API
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "ON_HOLD">("ALL");
  const [sessionFilter, setSessionFilter] = useState<"ALL" | "Morning" | "Afternoon" | "Evening">("ALL");

  // Booking Management Drawer / Modal State (Date click)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [activeDateModalTab, setActiveDateModalTab] = useState<"confirmed" | "hold" | "cancelled">("confirmed");

  // Add to Hold Modal State
  const [addHoldModalOpen, setAddHoldModalOpen] = useState(false);
  const [addHoldDateStr, setAddHoldDateStr] = useState<string>("");
  const [addHoldSubmitting, setAddHoldSubmitting] = useState(false);
  const [holdFormData, setHoldFormData] = useState({
    clientName: "",
    phoneNumber: "",
    email: "",
    meetingCity: "",
    meetingSession: "Morning" as "Morning" | "Afternoon" | "Evening",
    travelMode: "Car",
    travelOtherDetails: "",
    stayLocation: "",
    additionalNotes: "",
    holdReason: "",
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
  });

  // Action Dialog State (Cancel / Confirm / Edit)
  const [actionTargetBooking, setActionTargetBooking] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"CONFIRM" | "CANCEL" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Fetch Bookings from API
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filtered Bookings based on Search & Status & Session
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (sessionFilter !== "ALL" && b.meetingSession !== sessionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientMatch = b.clientName?.toLowerCase().includes(q);
        const cityMatch = b.meetingCity?.toLowerCase().includes(q);
        const phoneMatch = b.phoneNumber?.toLowerCase().includes(q);
        const stayMatch = b.stayLocation?.toLowerCase().includes(q);
        const travelMatch = b.travelMode?.toLowerCase().includes(q);
        if (!clientMatch && !cityMatch && !phoneMatch && !stayMatch && !travelMatch) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, statusFilter, sessionFilter, searchQuery]);

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Selected Month Bookings (for dynamic statistics)
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const selectedMonthBookings = useMemo(() => {
    return bookings.filter((b) => b.meetingDateStr?.startsWith(currentMonthPrefix));
  }, [bookings, currentMonthPrefix]);

  // Dynamic Statistics (Section 7 & 8)
  const monthlyStats = useMemo(() => {
    const active = selectedMonthBookings.filter((b) => b.status !== "CANCELLED");
    const confirmed = selectedMonthBookings.filter((b) => b.status === "CONFIRMED");
    const onHold = selectedMonthBookings.filter((b) => b.status === "ON_HOLD");
    const cancelled = selectedMonthBookings.filter((b) => b.status === "CANCELLED");

    // Total distinct travel days in month
    const travelDaysSet = new Set(active.map((b) => b.meetingDateStr));
    const totalTravelDays = travelDaysSet.size;

    // Travel breakdown
    const flights = active.filter((b) => b.travelMode?.toLowerCase() === "flight").length;
    const cars = active.filter((b) => b.travelMode?.toLowerCase() === "car").length;
    const trains = active.filter((b) => b.travelMode?.toLowerCase() === "train").length;
    const buses = active.filter((b) => b.travelMode?.toLowerCase() === "bus").length;
    const others = active.filter((b) => !["flight", "car", "train", "bus"].includes(b.travelMode?.toLowerCase() || "") && b.travelMode).length;

    // Stay locations
    const stayCount = active.filter((b) => b.stayLocation && b.stayLocation.trim().length > 0).length;

    // Unique cities visited
    const citiesSet = new Set(active.map((b) => b.meetingCity?.trim()).filter(Boolean));

    return {
      total: active.length,
      confirmed: confirmed.length,
      onHold: onHold.length,
      cancelled: cancelled.length,
      totalTravelDays,
      flights,
      cars,
      trains,
      buses,
      others,
      trainBus: trains + buses,
      stayCount,
      citiesCount: citiesSet.size,
      citiesList: Array.from(citiesSet).slice(0, 4),
    };
  }, [selectedMonthBookings]);

  // Map bookings by date key: YYYY-MM-DD
  const dateBookingsMap = useMemo(() => {
    const map = new Map<string, { confirmed: any[]; hold: any[]; cancelled: any[] }>();

    for (const b of filteredBookings) {
      const dKey = b.meetingDateStr;
      if (!map.has(dKey)) {
        map.set(dKey, { confirmed: [], hold: [], cancelled: [] });
      }

      const entry = map.get(dKey)!;
      if (b.status === "CONFIRMED") {
        entry.confirmed.push(b);
      } else if (b.status === "ON_HOLD") {
        entry.hold.push(b);
      } else if (b.status === "CANCELLED") {
        entry.cancelled.push(b);
      }
    }

    return map;
  }, [filteredBookings]);

  // Days calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: CalendarDay[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const key = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    prevMonthDays.push({
      date: prevDate,
      dayNum,
      isCurrentMonth: false,
      key,
    });
  }

  // Days of current month
  const currentMonthDays: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    currentMonthDays.push({
      date: new Date(year, month, d),
      dayNum: d,
      isCurrentMonth: true,
      key,
    });
  }

  // Days of next month
  const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalDaysSoFar % 7 === 0 ? 0 : 7 - (totalDaysSoFar % 7);
  const nextMonthDays: CalendarDay[] = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    const nextDate = new Date(year, month + 1, d);
    const key = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    nextMonthDays.push({
      date: nextDate,
      dayNum: d,
      isCurrentMonth: false,
      key,
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Week days
  const currentWeekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startOfWeek);
      cur.setDate(startOfWeek.getDate() + i);
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      week.push({
        date: cur,
        dayNum: cur.getDate(),
        isCurrentMonth: cur.getMonth() === month,
        key,
      });
    }
    return week;
  }, [currentDate, month]);

  const todayKey = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    if (calendarView === "month" || calendarView === "agenda") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (calendarView === "month" || calendarView === "agenda") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open Date Management Panel
  const handleDateClick = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    const dateData = dateBookingsMap.get(dateKey);
    if (dateData?.confirmed && dateData.confirmed.length > 0) {
      setActiveDateModalTab("confirmed");
    } else if (dateData?.hold && dateData.hold.length > 0) {
      setActiveDateModalTab("hold");
    } else {
      setActiveDateModalTab("confirmed");
    }
  };

  // Open Add to Hold Modal
  const openAddHoldModal = (dateKey?: string) => {
    const targetDate = dateKey || selectedDateKey || todayKey;
    setAddHoldDateStr(targetDate);
    setHoldFormData({
      clientName: "",
      phoneNumber: "",
      email: "",
      meetingCity: "",
      meetingSession: "Morning",
      travelMode: "Car",
      travelOtherDetails: "",
      stayLocation: "",
      additionalNotes: "",
      holdReason: "",
      priority: "MEDIUM",
    });
    setAddHoldModalOpen(true);
  };

  // Submit Add to Hold
  const handleAddHoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdFormData.clientName.trim() || !holdFormData.phoneNumber.trim() || !holdFormData.meetingCity.trim()) {
      toast.error("Please fill in Client Name, Phone Number, and Meeting City.");
      return;
    }

    setAddHoldSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...holdFormData,
          meetingDateStr: addHoldDateStr,
          status: "ON_HOLD",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add client to Hold list.");
      } else {
        toast.success(`Client ${holdFormData.clientName} successfully added to Hold for ${addHoldDateStr}!`);
        setAddHoldModalOpen(false);
        await fetchBookings();
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setAddHoldSubmitting(false);
    }
  };

  // Action Handlers
  const handleConfirmHoldBooking = async (booking: any) => {
    setActionTargetBooking(booking);
    setActionType("CONFIRM");
    setActionReason("");
  };

  const handleCancelBooking = (booking: any) => {
    setActionTargetBooking(booking);
    setActionType("CANCEL");
    setActionReason("");
  };

  const executeAction = async () => {
    if (!actionTargetBooking || !actionType) return;
    setActionSubmitting(true);

    try {
      const res = await fetch(`/api/admin/bookings/${actionTargetBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          reason: actionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to perform ${actionType} action.`);
      } else {
        toast.success(data.message || "Booking successfully updated!");
        setActionTargetBooking(null);
        setActionType(null);
        await fetchBookings();
      }
    } catch (err: any) {
      toast.error("An error occurred during booking status update.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const selectedDateData = selectedDateKey 
    ? dateBookingsMap.get(selectedDateKey) || { confirmed: [], hold: [], cancelled: [] }
    : { confirmed: [], hold: [], cancelled: [] };

  // Formatted date label for selected date
  const selectedDateObj = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : null;
  const formattedSelectedDate = selectedDateObj && !isNaN(selectedDateObj.getTime())
    ? selectedDateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : selectedDateKey;

  return (
    <div className="space-y-5">
      {/* 1. DYNAMIC MONTHLY TRAVEL & BOOKINGS SUMMARY (Section 7 & 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* Total Meetings */}
        <div className="p-3 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Total</span>
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{monthlyStats.total}</p>
          <span className="text-[9px] text-foreground/50 font-medium">In {MONTH_NAMES[month]}</span>
        </div>

        {/* Confirmed Meetings */}
        <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Confirmed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{monthlyStats.confirmed}</p>
          <span className="text-[9px] text-emerald-700/60 dark:text-emerald-300/60 font-semibold">Ready for tour</span>
        </div>

        {/* On Hold */}
        <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">On Hold</span>
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{monthlyStats.onHold}</p>
          <span className="text-[9px] text-amber-700/60 dark:text-amber-300/60 font-semibold">Waitlist queue</span>
        </div>

        {/* Travel Days */}
        <div className="p-3 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Travel Days</span>
            <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{monthlyStats.totalTravelDays}</p>
          <span className="text-[9px] text-foreground/50 font-medium">Active tour dates</span>
        </div>

        {/* Flights */}
        <div className="p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Flights</span>
            <Plane className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">{monthlyStats.flights}</p>
          <span className="text-[9px] text-indigo-700/60 dark:text-indigo-300/60 font-medium">Air trips</span>
        </div>

        {/* Car Trips */}
        <div className="p-3 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Car Trips</span>
            <Car className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{monthlyStats.cars}</p>
          <span className="text-[9px] text-foreground/50 font-medium">Road travel</span>
        </div>

        {/* Train / Bus */}
        <div className="p-3 rounded-2xl border border-border/50 glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-foreground/50 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Train / Bus</span>
            <Train className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground">{monthlyStats.trainBus}</p>
          <span className="text-[9px] text-foreground/50 font-medium">Transit</span>
        </div>

        {/* Stay Locations / Hotels */}
        <div className="p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Stay / Hotels</span>
            <Hotel className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{monthlyStats.stayCount}</p>
          <span className="text-[9px] text-rose-700/60 dark:text-rose-300/60 font-medium">Accommodations</span>
        </div>
      </div>

      {/* 2. DYNAMIC TRAVEL BREAKDOWN CHIPS (Section 8) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/50 glass-card text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1.5 mr-1">
            <Compass className="h-3.5 w-3.5 text-primary" />
            {MONTH_NAMES[month]} Tour Breakdown:
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold">
            <Plane className="h-3 w-3 text-indigo-500" />
            {monthlyStats.flights} Flights
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold">
            <Car className="h-3 w-3 text-blue-500" />
            {monthlyStats.cars} Car Rides
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
            <Train className="h-3 w-3 text-emerald-500" />
            {monthlyStats.trainBus} Train/Bus
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-bold">
            <Hotel className="h-3 w-3 text-rose-500" />
            {monthlyStats.stayCount} Hotel Stays
          </span>
        </div>

        {monthlyStats.citiesCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-foreground/60 font-medium">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span>Target Cities: </span>
            <span className="font-bold text-foreground truncate max-w-64">
              {monthlyStats.citiesList.join(", ")}
              {monthlyStats.citiesCount > 4 ? ` +${monthlyStats.citiesCount - 4} more` : ""}
            </span>
          </div>
        )}
      </div>

      {/* 3. CALENDAR HEADER BAR (Section 2) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-border/50 glass-card">
        {/* Navigation & Month Title */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1 bg-accent/40 rounded-xl p-1 border border-border/40 shrink-0">
            <button
              onClick={handlePrev}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg hover:bg-card text-foreground/70 hover:text-foreground transition-all cursor-pointer min-h-9 min-w-9 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-card text-foreground transition-all cursor-pointer min-h-9 flex items-center justify-center"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Month"
              className="p-1.5 rounded-lg hover:bg-card text-foreground/70 hover:text-foreground transition-all cursor-pointer min-h-9 min-w-9 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <CalendarIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-foreground tracking-tight">
                {calendarView === "month" && `${MONTH_NAMES[month]} ${year}`}
                {calendarView === "week" && `Week of ${MONTH_NAMES[currentWeekDays[0].date.getMonth()]} ${currentWeekDays[0].dayNum}, ${currentWeekDays[0].date.getFullYear()}`}
                {calendarView === "agenda" && `${MONTH_NAMES[month]} ${year} Agenda`}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-foreground/50 font-semibold truncate max-w-[280px] sm:max-w-none">
                {monthlyStats.confirmed} confirmed • {monthlyStats.onHold} on hold • {monthlyStats.totalTravelDays} active days
              </p>
            </div>
          </div>
        </div>

        {/* Controls, Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto">
          {/* Quick Search */}
          <div className="relative w-full sm:w-auto sm:min-w-44 sm:max-w-56 flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, city, hotel..."
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs rounded-xl border border-border/50 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium min-h-10 sm:min-h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* View Switcher: Month | Week | Agenda */}
          <div className="flex items-center p-1 rounded-xl bg-card border border-border/50 text-xs font-bold shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setCalendarView("month")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center min-h-9 flex items-center justify-center ${
                calendarView === "month"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView("week")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center min-h-9 flex items-center justify-center ${
                calendarView === "week"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView("agenda")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer text-center min-h-9 flex items-center justify-center ${
                calendarView === "agenda"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Status & Session Filters row on mobile */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-accent/40 rounded-xl px-2.5 py-1.5 border border-border/40 text-xs min-h-10 sm:min-h-9">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer w-full text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">🟢 Confirmed</option>
                <option value="ON_HOLD">🟠 On Hold</option>
              </select>
            </div>

            {/* Session Filter */}
            <div className="flex items-center gap-1 bg-accent/40 rounded-xl px-2.5 py-1.5 border border-border/40 text-xs min-h-10 sm:min-h-9">
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value as any)}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer w-full text-xs"
              >
                <option value="ALL">All Sessions</option>
                <option value="Morning">🌅 Morning</option>
                <option value="Afternoon">☀️ Afternoon</option>
                <option value="Evening">🌙 Evening</option>
              </select>
            </div>
          </div>

          {/* Add to Hold Button */}
          <button
            onClick={() => openAddHoldModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-10 sm:min-h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add to Hold</span>
          </button>
        </div>
      </div>

      {/* 4. CALENDAR LEGEND (Section 9) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-border/40 bg-accent/15 text-[10px]">
        <div className="flex flex-wrap items-center gap-3 font-semibold text-foreground/70">
          <span className="font-black uppercase tracking-wider text-foreground/50 flex items-center gap-1">
            <Info className="h-3 w-3 text-primary" />
            Legend:
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Confirmed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            On Hold
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Cancelled
          </span>
          <span className="text-foreground/30">|</span>
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Sunrise className="h-3 w-3" />
            Morning
          </span>
          <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
            <Sun className="h-3 w-3" />
            Afternoon
          </span>
          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <Moon className="h-3 w-3" />
            Evening
          </span>
          <span className="text-foreground/30">|</span>
          <span className="inline-flex items-center gap-1">
            <Plane className="h-3 w-3 text-indigo-500" /> Flight
          </span>
          <span className="inline-flex items-center gap-1">
            <Car className="h-3 w-3 text-blue-500" /> Car
          </span>
          <span className="inline-flex items-center gap-1">
            <Train className="h-3 w-3 text-emerald-500" /> Train/Bus
          </span>
          <span className="inline-flex items-center gap-1">
            <Hotel className="h-3 w-3 text-rose-500" /> Stay/Hotel
          </span>
        </div>

        <span className="text-foreground/40 font-medium">Click any date to manage bookings</span>
      </div>

      {/* 5. MONTH VIEW (Section 3, 4 & 5) */}
      {calendarView === "month" && (
        <div className="rounded-2xl border border-border/50 glass-card overflow-hidden shadow-xs">
          {/* Weekday Columns */}
          <div className="grid grid-cols-7 border-b border-border/40 bg-accent/25 text-center">
            {WEEKDAY_NAMES.map((wName, idx) => (
              <div
                key={wName}
                className={`py-2.5 text-[11px] font-black tracking-wider uppercase ${
                  idx === 0 || idx === 6 ? "text-primary/80" : "text-foreground/70"
                }`}
              >
                {wName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/20 bg-background/50">
            {allCalendarDays.map((dayItem) => {
              const dayData = dateBookingsMap.get(dayItem.key) || { confirmed: [], hold: [], cancelled: [] };
              const totalMeetings = dayData.confirmed.length + dayData.hold.length;
              const isToday = dayItem.key === todayKey;

              return (
                <div
                  key={dayItem.key}
                  onClick={() => handleDateClick(dayItem.key)}
                  className={`relative min-h-18 sm:min-h-28 md:min-h-44 p-1 sm:p-2 transition-all group flex flex-col justify-between ${
                    !dayItem.isCurrentMonth
                      ? "bg-accent/5 opacity-40 text-foreground/40"
                      : "text-foreground"
                  } hover:bg-primary/5 cursor-pointer`}
                >
                  {/* Date Header Row */}
                  <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-black rounded-lg transition-all ${
                        isToday
                          ? "h-5 w-5 sm:h-6 sm:w-6 bg-primary text-primary-foreground shadow-xs"
                          : "h-5 w-5 text-foreground/80 group-hover:text-foreground font-black"
                      }`}
                    >
                      {dayItem.dayNum}
                    </span>

                    {/* Confirmed & Hold Pill Indicators (Desktop / Tablet) */}
                    <div className="hidden sm:flex items-center gap-1">
                      {dayData.confirmed.length > 0 && (
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs" 
                          title={`${dayData.confirmed.length} Confirmed meeting(s)`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{dayData.confirmed.length} Conf</span>
                        </span>
                      )}
                      {dayData.hold.length > 0 && (
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs" 
                          title={`${dayData.hold.length} Client(s) on Hold`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>{dayData.hold.length} Hold</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Compact Day Indicators (< md) */}
                  <div className="sm:hidden flex flex-col items-center justify-center gap-1 my-auto py-0.5">
                    <div className="flex items-center gap-1">
                      {dayData.confirmed.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-2xs" title={`${dayData.confirmed.length} Confirmed`} />
                      )}
                      {dayData.hold.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-2xs" title={`${dayData.hold.length} On Hold`} />
                      )}
                    </div>
                    {totalMeetings > 0 && (
                      <span className="text-[8px] font-black text-foreground/80 leading-none bg-accent/70 px-1 py-0.5 rounded">
                        {totalMeetings}
                      </span>
                    )}
                  </div>

                  {/* Desktop Meeting Cards Preview (Structured for readability - Section 3) */}
                  <div className="hidden sm:block space-y-1.5 flex-1 overflow-hidden">
                    {/* Confirmed Meetings (Green themed) */}
                    {dayData.confirmed.slice(0, 2).map((m: any) => (
                      <div
                        key={m.id}
                        className="rounded-xl p-2 border border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-950/30 hover:border-emerald-500/60 transition-all shadow-2xs space-y-1 text-left"
                      >
                        {/* Client Name & Status Badge */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-[11px] text-foreground uppercase tracking-tight truncate">
                            {m.clientName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500 text-white shrink-0">
                            CONFIRMED
                          </span>
                        </div>

                        {/* City / Location */}
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-foreground/80 truncate">
                          <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{m.meetingCity}</span>
                        </div>

                        {/* Session & Travel Row */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <SessionBadge session={m.meetingSession} />
                          {m.travelMode && (
                            <TravelModeBadge mode={m.travelMode} details={m.travelOtherDetails} />
                          )}
                        </div>

                        {/* Stay Location (Hotel) */}
                        {m.stayLocation && m.stayLocation.trim() && (
                          <div className="flex items-center gap-1 text-[9px] font-medium text-foreground/60 truncate pt-0.5 border-t border-emerald-500/20">
                            <Hotel className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                            <span className="truncate">Stay: {m.stayLocation}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Hold Meetings (Amber themed) */}
                    {dayData.hold.slice(0, Math.max(0, 2 - dayData.confirmed.length)).map((h: any) => (
                      <div
                        key={h.id}
                        className="rounded-xl p-2 border border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/30 hover:border-amber-500/60 transition-all shadow-2xs space-y-1 text-left"
                      >
                        {/* Client Name & Status Badge */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-[11px] text-foreground uppercase tracking-tight truncate">
                            {h.clientName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500 text-white shrink-0">
                            ON HOLD
                          </span>
                        </div>

                        {/* City / Location */}
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-foreground/80 truncate">
                          <MapPin className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{h.meetingCity}</span>
                        </div>

                        {/* Session & Travel Row */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <SessionBadge session={h.meetingSession} />
                          {h.travelMode && (
                            <TravelModeBadge mode={h.travelMode} details={h.travelOtherDetails} />
                          )}
                        </div>

                        {/* Stay Location (Hotel) */}
                        {h.stayLocation && h.stayLocation.trim() && (
                          <div className="flex items-center gap-1 text-[9px] font-medium text-foreground/60 truncate pt-0.5 border-t border-amber-500/20">
                            <Hotel className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                            <span className="truncate">Stay: {h.stayLocation}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* "+ More" indicator if more than 2 meetings (Section 5) */}
                    {totalMeetings > 2 && (
                      <div className="text-[9px] font-black text-primary hover:underline pl-1 pt-0.5 flex items-center gap-1">
                        <span>+{totalMeetings - 2} More</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. WEEK VIEW */}
      {calendarView === "week" && (
        <div className="rounded-2xl border border-border/50 glass-card overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-border/40 bg-accent/25 text-center divide-x divide-border/20">
            {currentWeekDays.map((dayItem, idx) => {
              const isToday = dayItem.key === todayKey;
              return (
                <div key={dayItem.key} className="py-3 px-1">
                  <span className="text-[11px] font-black tracking-wider uppercase block text-foreground/60">
                    {WEEKDAY_NAMES[idx]}
                  </span>
                  <span className={`inline-flex items-center justify-center text-sm font-black rounded-lg mt-1 ${
                    isToday ? "h-7 w-7 bg-primary text-primary-foreground shadow-xs" : "text-foreground"
                  }`}>
                    {dayItem.dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-border/20 bg-background/50 min-h-96">
            {currentWeekDays.map((dayItem) => {
              const dayData = dateBookingsMap.get(dayItem.key) || { confirmed: [], hold: [], cancelled: [] };
              const allBookings = [...dayData.confirmed, ...dayData.hold];

              return (
                <div 
                  key={dayItem.key} 
                  onClick={() => handleDateClick(dayItem.key)}
                  className="p-2 space-y-2 cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  {allBookings.length === 0 ? (
                    <div className="py-16 text-center text-[10px] text-foreground/30 font-medium">
                      Available
                    </div>
                  ) : (
                    allBookings.map((b: any) => (
                      <div
                        key={b.id}
                        className={`p-2.5 rounded-xl border text-left shadow-xs space-y-1.5 ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-amber-500/10 border-amber-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <BookingStatusBadge status={b.status} />
                          <SessionBadge session={b.meetingSession} />
                        </div>

                        <h4 className="font-black text-xs text-foreground uppercase tracking-tight">
                          {b.clientName}
                        </h4>

                        <div className="space-y-1 text-[10px] text-foreground/70 pt-1 border-t border-border/30">
                          <div className="flex items-center gap-1 font-semibold">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{b.meetingCity}</span>
                          </div>
                          {b.travelMode && (
                            <TravelModeBadge mode={b.travelMode} details={b.travelOtherDetails} />
                          )}
                          {b.stayLocation && (
                            <div className="flex items-center gap-1 text-[9px] text-foreground/60 truncate">
                              <Hotel className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                              <span className="truncate">Stay: {b.stayLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. AGENDA / LIST VIEW (Mobile friendly chronological list - Section 11) */}
      {calendarView === "agenda" && (
        <div className="space-y-3">
          {currentMonthDays
            .filter((dayItem) => {
              const dayData = dateBookingsMap.get(dayItem.key);
              return dayData && (dayData.confirmed.length > 0 || dayData.hold.length > 0);
            })
            .map((dayItem) => {
              const dayData = dateBookingsMap.get(dayItem.key)!;
              const dateObj = new Date(`${dayItem.key}T00:00:00`);
              const dateTitle = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
              const isToday = dayItem.key === todayKey;

              return (
                <div
                  key={dayItem.key}
                  className="p-4 rounded-2xl border border-border/50 glass-card space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center h-7 w-7 text-xs font-black rounded-xl ${
                        isToday ? "bg-primary text-primary-foreground shadow-xs" : "bg-accent text-foreground font-black"
                      }`}>
                        {dayItem.dayNum}
                      </span>
                      <h3 className="text-sm font-black text-foreground">
                        {dateTitle}
                      </h3>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/15 text-primary">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDateClick(dayItem.key)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-xl border border-border/50 bg-card hover:bg-accent/80 text-foreground transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="h-3 w-3" />
                        Manage Date
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Confirmed Meetings */}
                    {dayData.confirmed.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-950/25 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-sm text-foreground uppercase tracking-tight">
                            {m.clientName}
                          </h4>
                          <BookingStatusBadge status="CONFIRMED" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80 pt-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="font-semibold">{m.meetingCity}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                            <a href={`tel:${m.phoneNumber}`} className="font-mono text-[11px] hover:underline">
                              {m.phoneNumber}
                            </a>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-500/20">
                          <SessionBadge session={m.meetingSession} />
                          {m.travelMode && (
                            <TravelModeBadge mode={m.travelMode} details={m.travelOtherDetails} />
                          )}
                          {m.stayLocation && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                              <Hotel className="h-3 w-3 text-rose-500" />
                              Stay: {m.stayLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Hold Meetings */}
                    {dayData.hold.map((h: any) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-xl border border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/25 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white">
                              #{h.queuePosition || 1}
                            </span>
                            <h4 className="font-black text-sm text-foreground uppercase tracking-tight">
                              {h.clientName}
                            </h4>
                          </div>
                          <BookingStatusBadge status="ON_HOLD" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80 pt-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="font-semibold">{h.meetingCity}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                            <a href={`tel:${h.phoneNumber}`} className="font-mono text-[11px] hover:underline">
                              {h.phoneNumber}
                            </a>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-500/20">
                          <SessionBadge session={h.meetingSession} />
                          {h.travelMode && (
                            <TravelModeBadge mode={h.travelMode} details={h.travelOtherDetails} />
                          )}
                          {h.stayLocation && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                              <Hotel className="h-3 w-3 text-rose-500" />
                              Stay: {h.stayLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          {currentMonthDays.filter((d) => {
            const data = dateBookingsMap.get(d.key);
            return data && (data.confirmed.length > 0 || data.hold.length > 0);
          }).length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-border/50 glass-card space-y-2">
              <CalendarIcon className="h-8 w-8 text-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-foreground/70">No bookings scheduled in {MONTH_NAMES[month]} {year}</p>
              <button
                onClick={() => openAddHoldModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. CALENDAR DATE DETAILS DRAWER / MODAL (Section 6) */}
      {selectedDateKey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-card text-foreground rounded-3xl border border-border/60 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-border/40 flex items-center justify-between gap-4 bg-accent/20 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                      {formattedSelectedDate}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground/60">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {selectedDateData.confirmed.length} Confirmed
                      </span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {selectedDateData.hold.length} On Hold
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddHoldModal(selectedDateKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Hold</span>
                </button>
                <button
                  onClick={() => setSelectedDateKey(null)}
                  className="p-2 rounded-xl border border-border/50 hover:bg-accent text-foreground/60 hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border/40 px-3 sm:px-6 bg-accent/10 shrink-0 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
              <button
                onClick={() => setActiveDateModalTab("confirmed")}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-11 ${
                  activeDateModalTab === "confirmed"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirmed ({selectedDateData.confirmed.length})</span>
              </button>
              <button
                onClick={() => setActiveDateModalTab("hold")}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-11 ${
                  activeDateModalTab === "hold"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>On Hold / Waitlist ({selectedDateData.hold.length})</span>
              </button>
              {selectedDateData.cancelled.length > 0 && (
                <button
                  onClick={() => setActiveDateModalTab("cancelled")}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-11 ${
                    activeDateModalTab === "cancelled"
                      ? "border-slate-500 text-slate-600 dark:text-slate-400"
                      : "border-transparent text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Cancelled ({selectedDateData.cancelled.length})</span>
                </button>
              )}
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* TAB 1: CONFIRMED MEETINGS */}
              {activeDateModalTab === "confirmed" && (
                <div className="space-y-4">
                  {selectedDateData.confirmed.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 space-y-2">
                      <p className="text-sm font-semibold text-foreground/50">
                        No confirmed meetings for this date yet.
                      </p>
                      <button
                        onClick={() => openAddHoldModal(selectedDateKey)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Client to Hold
                      </button>
                    </div>
                  ) : (
                    selectedDateData.confirmed.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-2xl border border-emerald-500/35 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-foreground uppercase tracking-tight">
                                {booking.clientName}
                              </h4>
                              <BookingStatusBadge status="CONFIRMED" />
                            </div>
                            <p className="text-xs text-foreground/60 font-medium">
                              Confirmed on {booking.confirmedAt ? new Date(booking.confirmedAt).toLocaleDateString() : "Approval"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <SessionBadge session={booking.meetingSession} />
                            {booking.travelMode && (
                              <TravelModeBadge mode={booking.travelMode} details={booking.travelOtherDetails} />
                            )}
                          </div>
                        </div>

                        {/* Meeting Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40">Location / City</span>
                            <div className="flex items-center gap-1 text-foreground font-bold">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{booking.meetingCity}</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40">Phone Number</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                              <a href={`tel:${booking.phoneNumber}`} className="hover:underline">
                                {booking.phoneNumber}
                              </a>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40">Stay Location</span>
                            <div className="flex items-center gap-1 text-foreground font-bold">
                              <Hotel className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              <span>{booking.stayLocation || "Not specified"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Notes / Verification details */}
                        {booking.additionalNotes && (
                          <div className="p-2.5 rounded-xl bg-card border border-border/50 text-xs text-foreground/80 space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40 block">Notes & Details</span>
                            <p>{booking.additionalNotes}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            {booking.verificationSheetId && (
                              <button
                                onClick={() => router.push(`/coordinator/report/${booking.verificationSheetId}`)}
                                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Verification Form</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                            >
                              Cancel Meeting
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: HOLD MEETINGS */}
              {activeDateModalTab === "hold" && (
                <div className="space-y-4">
                  {selectedDateData.hold.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 space-y-2">
                      <p className="text-sm font-semibold text-foreground/50">
                        No clients on hold for this date.
                      </p>
                      <button
                        onClick={() => openAddHoldModal(selectedDateKey)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Client to Hold
                      </button>
                    </div>
                  ) : (
                    selectedDateData.hold.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-2xl border border-amber-500/35 bg-amber-500/5 dark:bg-amber-950/20 space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white">
                              Queue #{booking.queuePosition || 1}
                            </span>
                            <div>
                              <h4 className="text-base font-black text-foreground uppercase tracking-tight">
                                {booking.clientName}
                              </h4>
                              <p className="text-[11px] text-foreground/60 font-medium">
                                Priority: <span className="font-bold text-amber-600 dark:text-amber-400">{booking.priority || "MEDIUM"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <SessionBadge session={booking.meetingSession} />
                            {booking.travelMode && (
                              <TravelModeBadge mode={booking.travelMode} details={booking.travelOtherDetails} />
                            )}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40">Requested City</span>
                            <div className="flex items-center gap-1 text-foreground font-bold">
                              <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>{booking.meetingCity}</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40">Phone Number</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                              <a href={`tel:${booking.phoneNumber}`} className="hover:underline">
                                {booking.phoneNumber}
                              </a>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-foreground/40">Stay Location</span>
                            <div className="flex items-center gap-1 text-foreground font-bold">
                              <Hotel className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              <span>{booking.stayLocation || "Not specified"}</span>
                            </div>
                          </div>
                        </div>

                        {booking.holdReason && (
                          <div className="p-2.5 rounded-xl bg-card border border-border/50 text-xs text-foreground/80 space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">Hold Reason</span>
                            <p>{booking.holdReason}</p>
                          </div>
                        )}

                        {/* Action buttons: Promote to Confirmed or Cancel */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                          <span className="text-[10px] text-foreground/50 font-medium">
                            Added on {new Date(booking.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="px-3 py-1.5 rounded-xl border border-border/60 hover:bg-accent text-foreground/70 text-xs font-bold transition-all cursor-pointer"
                            >
                              Remove from Hold
                            </button>
                            <button
                              onClick={() => handleConfirmHoldBooking(booking)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all cursor-pointer shadow-xs"
                            >
                              Confirm Booking
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: CANCELLED */}
              {activeDateModalTab === "cancelled" && (
                <div className="space-y-3">
                  {selectedDateData.cancelled.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="p-3.5 rounded-xl border border-slate-500/30 bg-slate-500/5 text-xs space-y-1 opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground line-through">{booking.clientName}</span>
                        <BookingStatusBadge status="CANCELLED" />
                      </div>
                      <p className="text-foreground/60">{booking.meetingCity} • {booking.meetingSession} Session</p>
                      {booking.cancellationReason && (
                        <p className="text-[10px] text-rose-500 font-semibold">Reason: {booking.cancellationReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. ADD TO HOLD MODAL (Section 2 & 6) */}
      {addHoldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-card text-foreground rounded-3xl border border-border/60 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            <div className="p-4 sm:p-6 border-b border-border/40 flex items-center justify-between gap-3 bg-amber-500/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    Add Client to Hold List
                  </h3>
                  <p className="text-xs text-foreground/60 font-medium">
                    Schedule client on hold for date: <span className="font-bold text-amber-600 dark:text-amber-400">{addHoldDateStr}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAddHoldModalOpen(false)}
                className="p-2 rounded-xl border border-border/50 hover:bg-accent text-foreground/60 hover:text-foreground transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddHoldSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Client / Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={holdFormData.clientName}
                    onChange={(e) => setHoldFormData({ ...holdFormData, clientName: e.target.value })}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={holdFormData.phoneNumber}
                    onChange={(e) => setHoldFormData({ ...holdFormData, phoneNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Requested Meeting Date
                  </label>
                  <input
                    type="date"
                    required
                    value={addHoldDateStr}
                    onChange={(e) => setAddHoldDateStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Meeting City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={holdFormData.meetingCity}
                    onChange={(e) => setHoldFormData({ ...holdFormData, meetingCity: e.target.value })}
                    placeholder="e.g. Hyderabad / Vijayawada"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Preferred Session
                  </label>
                  <select
                    value={holdFormData.meetingSession}
                    onChange={(e) => setHoldFormData({ ...holdFormData, meetingSession: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                  >
                    <option value="Morning">🌅 Morning</option>
                    <option value="Afternoon">☀️ Afternoon</option>
                    <option value="Evening">🌙 Evening</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                    Travel Mode
                  </label>
                  <select
                    value={holdFormData.travelMode}
                    onChange={(e) => setHoldFormData({ ...holdFormData, travelMode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                  >
                    <option value="Car">🚗 Car</option>
                    <option value="Flight">✈️ Flight</option>
                    <option value="Train">🚆 Train</option>
                    <option value="Bus">🚌 Bus</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                  Stay Location (Hotel / Accommodation)
                </label>
                <input
                  type="text"
                  value={holdFormData.stayLocation}
                  onChange={(e) => setHoldFormData({ ...holdFormData, stayLocation: e.target.value })}
                  placeholder="Enter hotel name, address or accommodation location"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                  Hold Reason / Conflict Note
                </label>
                <input
                  type="text"
                  value={holdFormData.holdReason}
                  onChange={(e) => setHoldFormData({ ...holdFormData, holdReason: e.target.value })}
                  placeholder="e.g. Existing confirmed meeting on same date; added to waitlist"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={holdFormData.additionalNotes}
                  onChange={(e) => setHoldFormData({ ...holdFormData, additionalNotes: e.target.value })}
                  placeholder="Special instructions, convener references, etc."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setAddHoldModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border/60 hover:bg-accent text-foreground/70 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addHoldSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {addHoldSubmitting ? "Adding to Hold..." : "Save to Hold List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. ACTION DIALOG (Promote to Confirmed / Cancel) */}
      {actionTargetBooking && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card text-foreground rounded-3xl border border-border/60 shadow-2xl max-w-md w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${
                actionType === "CONFIRM" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              }`}>
                {actionType === "CONFIRM" ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {actionType === "CONFIRM" ? "Confirm Hold Booking" : "Cancel Meeting Booking"}
                </h3>
                <p className="text-xs text-foreground/60 font-medium">
                  {actionType === "CONFIRM"
                    ? `Promote "${actionTargetBooking.clientName}" to CONFIRMED for ${actionTargetBooking.meetingDateStr}?`
                    : `Cancel booking for "${actionTargetBooking.clientName}" on ${actionTargetBooking.meetingDateStr}?`}
                </p>
              </div>
            </div>

            {actionType === "CANCEL" && (
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-foreground/70">
                  Cancellation Reason (Optional)
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Client requested postponement"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionTargetBooking(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl border border-border/60 hover:bg-accent text-foreground/70 text-xs font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={executeAction}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                  actionType === "CONFIRM" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionSubmitting ? "Processing..." : actionType === "CONFIRM" ? "Yes, Confirm Booking" : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
