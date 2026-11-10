"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, Users, Phone, ShieldCheck, CheckCircle2, 
  Clock, AlertCircle, PhoneCall, Eye, X, Building, 
  Check, Sunrise, Sun, Moon, 
  Car, Plane, Train, Bus, Navigation, Hotel, 
  AlertTriangle, Plus, 
  Search, Filter, CalendarDays, Compass, CalendarCheck, 
  ArrowRight, Info 
} from "lucide-react";
import { toast } from "sonner";
import { getAvailableStates, getDistrictsForState } from "@/lib/geographic";

/**
 * Canonical dictionary mapping common abbreviations and short codes to their FULL official Town, City, or Village names.
 */
export const PLACE_ABBREVIATIONS: Record<string, string> = {
  // Andhra Pradesh
  amp: "Amalapuram",
  ampl: "Amalapuram",
  amalapuram: "Amalapuram",
  rjy: "Rajahmundry",
  rajahmundry: "Rajahmundry",
  rjmd: "Rajahmundry",
  kkd: "Kakinada",
  kakinada: "Kakinada",
  vja: "Vijayawada",
  bza: "Vijayawada",
  vij: "Vijayawada",
  vijayawada: "Vijayawada",
  gnt: "Guntur",
  guntur: "Guntur",
  vzg: "Visakhapatnam",
  vizag: "Visakhapatnam",
  visakhapatnam: "Visakhapatnam",
  tpt: "Tirupati",
  tpti: "Tirupati",
  tirupati: "Tirupati",
  nlr: "Nellore",
  nellore: "Nellore",
  kdp: "Kadapa",
  kadapa: "Kadapa",
  krn: "Kurnool",
  kurn: "Kurnool",
  kurnool: "Kurnool",
  ong: "Ongole",
  ogl: "Ongole",
  ongole: "Ongole",
  elr: "Eluru",
  eluru: "Eluru",
  bvrm: "Bhimavaram",
  bhimavaram: "Bhimavaram",
  mtm: "Machilipatnam",
  mct: "Machilipatnam",
  machilipatnam: "Machilipatnam",
  vzm: "Vizianagaram",
  vizianagaram: "Vizianagaram",
  sklm: "Srikakulam",
  srikakulam: "Srikakulam",
  atp: "Ananthapuramu",
  anant: "Ananthapuramu",
  ananthapuramu: "Ananthapuramu",
  nndl: "Nandyal",
  nandyal: "Nandyal",
  akp: "Anakapalli",
  anakapalli: "Anakapalli",
  ctr: "Chittoor",
  chittoor: "Chittoor",
  any: "Annamayya",
  annamayya: "Annamayya",
  bptl: "Bapatla",
  bapatla: "Bapatla",
  plnd: "Palnadu",
  palnadu: "Palnadu",
  konaseema: "Konaseema",
  rzl: "Razole",
  razole: "Razole",
  mvd: "Mummidivaram",
  mummidivaram: "Mummidivaram",
  rvp: "Ravulapalem",
  ravulapalem: "Ravulapalem",
  ktp: "Kothapeta",
  kothapeta: "Kothapeta",
  mrm: "Muramalla",
  muramalla: "Muramalla",
  anv: "Annavaram",
  annavaram: "Annavaram",
  tuni: "Tuni",
  pit: "Pithapuram",
  pithapuram: "Pithapuram",
  mnd: "Mandapeta",
  mandapeta: "Mandapeta",
  rcpm: "Ramachandrapuram",
  ramachandrapuram: "Ramachandrapuram",
  plv: "Palakollu",
  palakollu: "Palakollu",
  nrs: "Narsapuram",
  narsapuram: "Narsapuram",
  tad: "Tadepalligudem",
  tadepalligudem: "Tadepalligudem",
  tng: "Tanuku",
  tanuku: "Tanuku",
  jgd: "Jaggampeta",
  jaggampeta: "Jaggampeta",

  // Telangana
  hyd: "Hyderabad",
  hyderabad: "Hyderabad",
  sec: "Secunderabad",
  secunderabad: "Secunderabad",
  wgl: "Warangal",
  warangal: "Warangal",
  knr: "Karimnagar",
  karimnagar: "Karimnagar",
  khm: "Khammam",
  khammam: "Khammam",
  nzb: "Nizamabad",
  nizamabad: "Nizamabad",
  mncl: "Mancherial",
  mancherial: "Mancherial",
  rmg: "Ramagundam",
  ramagundam: "Ramagundam",
  srd: "Suryapet",
  suryapet: "Suryapet",
  nlg: "Nalgonda",
  nalgonda: "Nalgonda",
  mbnr: "Mahabubnagar",
  mahabubnagar: "Mahabubnagar",
  sdpt: "Siddipet",
  siddipet: "Siddipet",

  // Tamil Nadu
  chn: "Chennai",
  mas: "Chennai",
  chennai: "Chennai",
  cbe: "Coimbatore",
  coimbatore: "Coimbatore",
  mdu: "Madurai",
  madurai: "Madurai",
  trchy: "Tiruchirappalli",
  tpj: "Tiruchirappalli",
  tiruchirappalli: "Tiruchirappalli",
  slm: "Salem",
  salem: "Salem",
  tir: "Tiruppur",
  tiruppur: "Tiruppur",
  erd: "Erode",
  erode: "Erode",
  vell: "Vellore",
  vellore: "Vellore",
  tjr: "Thanjavur",
  thanjavur: "Thanjavur",
  tut: "Thoothukudi",
  thoothukudi: "Thoothukudi",
  tnv: "Tirunelveli",
  tirunelveli: "Tirunelveli",
  ngl: "Nagercoil",
  nagercoil: "Nagercoil",

  // Karnataka
  blr: "Bengaluru",
  bng: "Bengaluru",
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  mys: "Mysuru",
  mysore: "Mysuru",
  mysuru: "Mysuru",
  mng: "Mangaluru",
  mangalore: "Mangaluru",
  mangaluru: "Mangaluru",
  hbl: "Hubballi",
  hubli: "Hubballi",
  hubballi: "Hubballi",
  bgm: "Belagavi",
  belgaum: "Belagavi",
  belagavi: "Belagavi",

  // Metros
  mum: "Mumbai",
  bom: "Mumbai",
  mumbai: "Mumbai",
  pne: "Pune",
  pune: "Pune",
  del: "Delhi",
  delhi: "Delhi",
  kol: "Kolkata",
  ccu: "Kolkata",
  kolkata: "Kolkata",
};

/**
 * Normalizes any town, city, or village string by resolving abbreviations (e.g. AMP -> Amalapuram)
 * and converting raw strings to proper Title Case.
 */
export function normalizePlaceName(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  if (!cleaned) return "";

  const key = cleaned.toLowerCase();
  if (PLACE_ABBREVIATIONS[key]) {
    return PLACE_ABBREVIATIONS[key];
  }

  const alphaKey = key.replace(/[^a-z]/g, "");
  if (PLACE_ABBREVIATIONS[alphaKey]) {
    return PLACE_ABBREVIATIONS[alphaKey];
  }

  // Handle multi-word strings (e.g. "East Godavari (Rajahmundry)", "kothapeta mandal")
  return cleaned
    .split(/\s+/)
    .map((word) => {
      if (word.startsWith("(") && word.endsWith(")")) {
        const inner = word.slice(1, -1);
        const innerKey = inner.toLowerCase();
        const expanded = PLACE_ABBREVIATIONS[innerKey] || (inner.charAt(0).toUpperCase() + inner.slice(1).toLowerCase());
        return `(${expanded})`;
      }
      const lower = word.toLowerCase();
      if (PLACE_ABBREVIATIONS[lower]) {
        return PLACE_ABBREVIATIONS[lower];
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Robust extraction of the FULL, unabbreviated Village / Town / City name.
 * Resolves abbreviations (e.g. "AMP" -> "Amalapuram", "RJY" -> "Rajahmundry").
 */
export function extractVillageTownName(item: any): string {
  if (!item) return "Meeting Location";

  // 1. Direct meetingCity on booking
  if (item.meetingCity && typeof item.meetingCity === "string" && item.meetingCity.trim() && item.meetingCity !== "Main Location" && item.meetingCity !== "Location") {
    const raw = item.meetingCity.trim();
    if (raw.includes("/")) {
      const parts = raw.split("/").map((p: string) => p.trim()).filter(Boolean);
      const candidate = parts[parts.length - 1];
      if (candidate) return normalizePlaceName(candidate);
    }
    if (raw.includes(",")) {
      const parts = raw.split(",").map((p: string) => p.trim()).filter(Boolean);
      const candidate = parts[0];
      if (candidate) return normalizePlaceName(candidate);
    }
    return normalizePlaceName(raw);
  }

  // 2. Local Part / Unit
  const part = item.part || item.verificationSheet?.part;
  if (part && part !== "General Unit" && part !== "Not Specified" && part !== "HQ") {
    return normalizePlaceName(part);
  }

  // 3. stateDistrictCity (VerificationSheet)
  const sdc = item.stateDistrictCity || item.verificationSheet?.stateDistrictCity;
  if (sdc && typeof sdc === "string" && sdc.trim()) {
    const raw = sdc.trim();
    if (raw.includes("/")) {
      const parts = raw.split("/").map((p: string) => p.trim()).filter(Boolean);
      const candidate = parts[parts.length - 1] || parts[0];
      if (candidate) return normalizePlaceName(candidate);
    }
    if (raw.includes(",")) {
      const parts = raw.split(",").map((p: string) => p.trim()).filter(Boolean);
      const candidate = parts[0];
      if (candidate) return normalizePlaceName(candidate);
    }
    return normalizePlaceName(raw);
  }

  // 4. location (MeetingConfirmation)
  if (item.location && typeof item.location === "string" && item.location.trim()) {
    const raw = item.location.trim();
    if (raw.includes(",")) {
      return normalizePlaceName(raw.split(",")[0].trim());
    }
    return normalizePlaceName(raw);
  }

  // 5. District fallback
  const dist = item.district || item.verificationSheet?.district;
  if (dist && dist !== "General District") {
    return normalizePlaceName(dist);
  }

  return "Meeting Location";
}

/**
 * Returns full district name cleanly (e.g. "Konaseema", "East Godavari")
 */
export function extractDistrictName(item: any): string {
  if (!item) return "";
  const directDistrict = item.district || item.verificationSheet?.district;
  if (directDistrict && directDistrict !== "General District") {
    return normalizePlaceName(directDistrict);
  }
  const sdc = item.stateDistrictCity || item.verificationSheet?.stateDistrictCity || item.meetingCity;
  if (sdc && typeof sdc === "string") {
    if (sdc.includes("/")) {
      const parts = sdc.split("/").map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return normalizePlaceName(parts[1]);
      }
    }
  }
  return "";
}

/**
 * Extracts meeting duration (how many days) and scheduled date label.
 */
export function extractMeetingDuration(booking: any): { numberOfDays: number; datesLabel: string } {
  if (!booking) return { numberOfDays: 1, datesLabel: "1 Day" };

  const directDays = booking.verificationSheet?.numberOfDays;
  if (typeof directDays === "number" && directDays > 0) {
    return {
      numberOfDays: directDays,
      datesLabel: booking.verificationSheet?.meetingDates || booking.meetingDateStr || `${directDays} Day Meeting`,
    };
  }

  const meetingDates = booking.verificationSheet?.meetingDates;
  if (meetingDates && typeof meetingDates === "string") {
    if (meetingDates.includes(",")) {
      const count = meetingDates.split(",").filter((s: string) => s.trim().length > 0).length;
      return { numberOfDays: Math.max(1, count), datesLabel: meetingDates };
    }
    if (meetingDates.toLowerCase().includes(" to ")) {
      const parts = meetingDates.split(/ to /i).map((s: string) => s.trim());
      if (parts.length === 2) {
        const d1 = new Date(parts[0]);
        const d2 = new Date(parts[1]);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          return { numberOfDays: diffDays, datesLabel: meetingDates };
        }
      }
      return { numberOfDays: 2, datesLabel: meetingDates };
    }
  }

  return { numberOfDays: 1, datesLabel: booking.meetingDateStr || "1 Day" };
}

function parseMeetingDateKey(dateStr?: string | null, fallbackDate?: any): string {
  if (dateStr) {
    const trimmed = dateStr.trim();
    // 1. ISO YYYY-MM-DD
    const matchIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchIso) {
      return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
    }
    // 2. Indian DD-MM-YYYY or DD/MM/YYYY
    const matchDmy = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (matchDmy) {
      const d = matchDmy[1].padStart(2, "0");
      const m = matchDmy[2].padStart(2, "0");
      const y = matchDmy[3];
      return `${y}-${m}-${d}`;
    }
    // 3. Fallback date parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  if (fallbackDate) {
    const parsed = new Date(fallbackDate);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  return "";
}

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

  const label = details ? `${mode || "Travel"} (${details})` : (mode || "Travel");

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${colorCls}`} title={label}>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate max-w-40">{label}</span>
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
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");

  const availableStates = useMemo(() => getAvailableStates(), []);
  const availableDistricts = useMemo(() => {
    if (selectedState === "ALL") return [];
    return getDistrictsForState(selectedState);
  }, [selectedState]);

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

  // Merge Bookings from API with any completed Verifications prop
  const allEvents = useMemo(() => {
    const list: any[] = [...bookings];
    const existingSheetIds = new Set(bookings.map((b) => b.verificationSheetId).filter(Boolean));

    for (const v of verifications) {
      if (v.id && !existingSheetIds.has(v.id)) {
        const dKey = parseMeetingDateKey(v.meetingDates, v.approvedAt || v.submittedAt || v.createdAt);
        if (dKey) {
          list.push({
            id: `vsheet-${v.id}`,
            verificationSheetId: v.id,
            clientName: v.convenerName || "Outreach Client",
            phoneNumber: v.contactNumber || "N/A",
            meetingDateStr: dKey,
            meetingDate: new Date(dKey),
            meetingCity: v.stateDistrictCity || v.part || v.district || "Meeting Location",
            meetingSession: v.meetingSession || "Morning",
            travelMode: v.travelMode || null,
            travelOtherDetails: v.travelOtherDetails || null,
            stayLocation: v.stayLocation || null,
            additionalNotes: v.reportTitle || `Verification Sheet ${v.reportId || ""}`,
            status: "CONFIRMED",
            confirmedAt: v.approvedAt || v.createdAt,
            verificationSheet: v,
          });
          existingSheetIds.add(v.id);
        }
      }
    }

    return list;
  }, [bookings, verifications]);

  // Filtered Events based on Search & Status & Session & Geographic filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (sessionFilter !== "ALL" && b.meetingSession !== sessionFilter) return false;

      // State Filter
      if (selectedState !== "ALL") {
        const bState = (b.verificationSheet?.state || "").toLowerCase();
        const cityLower = (b.meetingCity || "").toLowerCase();
        const stateLower = selectedState.toLowerCase();
        if (bState !== stateLower && !cityLower.includes(stateLower)) {
          return false;
        }
      }

      // District Filter
      if (selectedDistrict !== "ALL") {
        const bDistrict = (b.verificationSheet?.district || "").toLowerCase();
        const cityLower = (b.meetingCity || "").toLowerCase();
        const distLower = selectedDistrict.toLowerCase();
        if (bDistrict !== distLower && !cityLower.includes(distLower)) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientMatch = b.clientName?.toLowerCase().includes(q);
        const cityMatch = b.meetingCity?.toLowerCase().includes(q);
        const villageMatch = extractVillageTownName(b).toLowerCase().includes(q);
        const phoneMatch = b.phoneNumber?.toLowerCase().includes(q);
        const stayMatch = b.stayLocation?.toLowerCase().includes(q);
        const travelMatch = b.travelMode?.toLowerCase().includes(q);
        const reportMatch = b.verificationSheet?.meetingReport?.reportId?.toLowerCase().includes(q);
        const churchMatch = b.verificationSheet?.churchMinistryName?.toLowerCase().includes(q);
        if (!clientMatch && !cityMatch && !villageMatch && !phoneMatch && !stayMatch && !travelMatch && !reportMatch && !churchMatch) {
          return false;
        }
      }
      return true;
    });
  }, [allEvents, statusFilter, sessionFilter, selectedState, selectedDistrict, searchQuery]);

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Selected Month Bookings (for dynamic statistics)
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const selectedMonthBookings = useMemo(() => {
    return filteredEvents.filter((b) => b.meetingDateStr?.startsWith(currentMonthPrefix));
  }, [filteredEvents, currentMonthPrefix]);

  // Dynamic Statistics
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
    const citiesSet = new Set(active.map((b) => extractVillageTownName(b)).filter(Boolean));

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

    for (const b of filteredEvents) {
      const dKey = b.meetingDateStr;
      if (!dKey || typeof dKey !== "string" || !dKey.trim()) continue;

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
  }, [filteredEvents]);

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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (actionTargetBooking) {
          setActionTargetBooking(null);
          setActionType(null);
        } else if (addHoldModalOpen) {
          setAddHoldModalOpen(false);
        } else if (selectedDateKey) {
          setSelectedDateKey(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionTargetBooking, addHoldModalOpen, selectedDateKey]);

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
  const handleAddHoldSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      {/* 1. CALENDAR HEADER & CONTROLS TOOLBAR */}
      <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm p-4 sm:p-5 space-y-4">
        {/* Row 1: Month Title & Navigation | View Switcher | Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navigation & Month Heading */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-accent/40 rounded-2xl p-1 border border-border/40 shrink-0">
              <button
                onClick={handlePrev}
                aria-label="Previous Month"
                className="p-2 rounded-xl hover:bg-card text-foreground/70 hover:text-foreground transition-all cursor-pointer min-h-9 min-w-9 flex items-center justify-center shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl text-xs font-black hover:bg-card text-foreground transition-all cursor-pointer min-h-9 flex items-center justify-center shadow-2xs"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                aria-label="Next Month"
                className="p-2 rounded-xl hover:bg-card text-foreground/70 hover:text-foreground transition-all cursor-pointer min-h-9 min-w-9 flex items-center justify-center shadow-2xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight">
                    {calendarView === "month" && `${MONTH_NAMES[month]} ${year}`}
                    {calendarView === "week" && `Week of ${MONTH_NAMES[currentWeekDays[0].date.getMonth()]} ${currentWeekDays[0].dayNum}, ${currentWeekDays[0].date.getFullYear()}`}
                    {calendarView === "agenda" && `${MONTH_NAMES[month]} ${year} Agenda`}
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Schedule
                  </span>
                  {(loadingBookings || externalLoading) && (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-foreground/50 font-medium">
                  Confirmed meetings, transit modes, hotel stays, and regional outreach agenda.
                </p>
              </div>
            </div>
          </div>

          {/* View Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Month | Week | Agenda */}
            <div className="flex items-center p-1 rounded-2xl bg-accent/40 border border-border/50 text-xs font-black shadow-2xs">
              <button
                onClick={() => setCalendarView("month")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer text-center min-h-9 flex items-center justify-center ${
                  calendarView === "month"
                    ? "bg-primary text-primary-foreground shadow-xs font-black"
                    : "text-foreground/60 hover:text-foreground font-bold"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setCalendarView("week")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer text-center min-h-9 flex items-center justify-center ${
                  calendarView === "week"
                    ? "bg-primary text-primary-foreground shadow-xs font-black"
                    : "text-foreground/60 hover:text-foreground font-bold"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView("agenda")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer text-center min-h-9 flex items-center justify-center ${
                  calendarView === "agenda"
                    ? "bg-primary text-primary-foreground shadow-xs font-black"
                    : "text-foreground/60 hover:text-foreground font-bold"
                }`}
              >
                Agenda
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-44 sm:min-w-56 flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search town, client, hotel..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl border border-border/50 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium min-h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Add to Hold Button */}
            <button
              onClick={() => openAddHoldModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all cursor-pointer min-h-10 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add to Hold</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean Interactive Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-border/40 text-xs">
          {/* Status Quick Toggle Tabs */}
          <div className="flex items-center gap-1.5 bg-accent/30 p-1 rounded-2xl border border-border/40">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                statusFilter === "ALL"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter("CONFIRMED")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                statusFilter === "CONFIRMED"
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-2 ring-emerald-500/20" />
              Confirmed ({monthlyStats.confirmed})
            </button>
            <button
              onClick={() => setStatusFilter("ON_HOLD")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                statusFilter === "ON_HOLD"
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 ring-2 ring-amber-500/20" />
              On Hold ({monthlyStats.onHold})
            </button>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Session Filter */}
            <div className="flex items-center gap-1.5 bg-accent/30 rounded-2xl px-3 py-1.5 border border-border/40 text-xs">
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value as any)}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Sessions</option>
                <option value="Morning">🌅 Morning</option>
                <option value="Afternoon">☀️ Afternoon</option>
                <option value="Evening">🌙 Evening</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-1.5 bg-accent/30 rounded-2xl px-3 py-1.5 border border-border/40 text-xs">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("ALL");
                }}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer text-xs max-w-44 truncate"
              >
                <option value="ALL">All States (India)</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter (Conditional) */}
            {availableDistricts.length > 0 && (
              <div className="flex items-center gap-1.5 bg-accent/30 rounded-2xl px-3 py-1.5 border border-border/40 text-xs">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer text-xs max-w-44 truncate"
                >
                  <option value="ALL">All Districts ({availableDistricts.length})</option>
                  {availableDistricts.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters Reset */}
            {(statusFilter !== "ALL" || sessionFilter !== "ALL" || selectedState !== "ALL" || selectedDistrict !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setSessionFilter("ALL");
                  setSelectedState("ALL");
                  setSelectedDistrict("ALL");
                  setSearchQuery("");
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold text-xs transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE CALENDAR KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Confirmed Meetings */}
        <div className="p-4 rounded-3xl bg-card border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Confirmed Meetings
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground tracking-tight">{monthlyStats.confirmed}</span>
            <span className="text-[11px] font-semibold text-foreground/60">Locked in Schedule</span>
          </div>
        </div>

        {/* 2. On Hold Meetings */}
        <div className="p-4 rounded-3xl bg-card border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              On Hold Bookings
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground tracking-tight">{monthlyStats.onHold}</span>
            <span className="text-[11px] font-semibold text-foreground/60">Awaiting Finalization</span>
          </div>
        </div>

        {/* 3. Active Travel Days */}
        <div className="p-4 rounded-3xl bg-card border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.08] via-indigo-500/[0.02] to-transparent shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Outreach Days
            </span>
            <CalendarCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground tracking-tight">{monthlyStats.totalTravelDays}</span>
            <span className="text-[11px] font-semibold text-foreground/60">Days Scheduled</span>
          </div>
        </div>

        {/* 4. Target Towns / Cities */}
        <div className="p-4 rounded-3xl bg-card border border-sky-500/25 bg-gradient-to-br from-sky-500/[0.08] via-sky-500/[0.02] to-transparent shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
              Target Locations
            </span>
            <MapPin className="h-4 w-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground tracking-tight">{monthlyStats.citiesCount}</span>
            <span className="text-[11px] font-semibold text-foreground/60">Towns & Cities</span>
          </div>
        </div>
      </div>

      {/* 3. MONTH VIEW */}
      {calendarView === "month" && (
        <div className="rounded-3xl border border-border/70 bg-card/50 backdrop-blur-md overflow-hidden shadow-sm">
          {/* Weekday Columns Header */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-accent/30 text-center">
            {WEEKDAY_NAMES.map((wName, idx) => (
              <div
                key={wName}
                className={`py-3.5 text-[11px] font-black tracking-widest uppercase ${
                  idx === 0 || idx === 6 ? "text-primary font-black" : "text-foreground/70"
                }`}
              >
                {wName}
              </div>
            ))}
          </div>

          {/* Days Grid - Sharp 1px Grid Layout */}
          <div className="grid grid-cols-7 gap-[1px] bg-border/40 p-[1px]">
            {allCalendarDays.map((dayItem) => {
              const dayData = dateBookingsMap.get(dayItem.key) || { confirmed: [], hold: [], cancelled: [] };
              const totalMeetings = dayData.confirmed.length + dayData.hold.length;
              const hasMeetings = totalMeetings > 0;
              const isToday = dayItem.key === todayKey;

              return (
                <div
                  key={dayItem.key}
                  onClick={() => handleDateClick(dayItem.key)}
                  className={`relative min-h-[110px] sm:min-h-[160px] md:min-h-[200px] lg:min-h-[225px] p-2 sm:p-2.5 transition-all group flex flex-col justify-between ${
                    !dayItem.isCurrentMonth
                      ? "bg-muted/15 dark:bg-muted/5 opacity-40 text-muted-foreground/60"
                      : isToday
                      ? "bg-primary/[0.04] text-foreground ring-2 ring-inset ring-primary/40 shadow-xs"
                      : hasMeetings
                      ? "bg-card dark:bg-card/90 text-foreground"
                      : "bg-card/70 dark:bg-card/40 hover:bg-card/90 text-foreground"
                  } hover:bg-primary/[0.03] cursor-pointer`}
                >
                  {/* Date Header Row */}
                  <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                    <span
                      className={`inline-flex items-center justify-center rounded-xl transition-all ${
                        isToday
                          ? "h-7 w-7 bg-primary text-primary-foreground font-black text-xs shadow-md ring-4 ring-primary/20"
                          : hasMeetings
                          ? "h-6 w-6 text-foreground font-black text-sm group-hover:text-primary transition-colors"
                          : "h-6 w-6 text-foreground/70 group-hover:text-primary font-bold text-xs"
                      }`}
                    >
                      {dayItem.dayNum}
                    </span>

                    {/* Micro count badges (Desktop / Tablet) */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {dayData.confirmed.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{dayData.confirmed.length}</span>
                        </span>
                      )}
                      {dayData.hold.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>{dayData.hold.length}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Compact Day View (< sm) */}
                  <div className="sm:hidden flex flex-col items-stretch justify-center gap-1 w-full my-auto py-1">
                    {dayData.confirmed.length > 0 && (
                      <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-1 text-[10px] font-black text-emerald-800 dark:text-emerald-200 text-center shadow-2xs leading-tight break-words [word-break:break-word]">
                        {extractVillageTownName(dayData.confirmed[0])}
                      </div>
                    )}
                    {dayData.confirmed.length === 0 && dayData.hold.length > 0 && (
                      <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-1.5 py-1 text-[10px] font-black text-amber-800 dark:text-amber-200 text-center shadow-2xs leading-tight break-words [word-break:break-word]">
                        {extractVillageTownName(dayData.hold[0])}
                      </div>
                    )}
                    {totalMeetings > 1 && (
                      <span className="text-[9px] font-black text-primary text-center leading-none mt-0.5">
                        +{totalMeetings - 1} more
                      </span>
                    )}
                  </div>

                  {/* Desktop Modern Event Cards Preview */}
                  <div className="hidden sm:block space-y-1.5 flex-1 overflow-hidden">
                    {/* Confirmed Meetings (Modern sleek card with emerald accent border) */}
                    {dayData.confirmed.slice(0, 2).map((m: any) => {
                      const villageTown = extractVillageTownName(m);
                      const districtName = extractDistrictName(m);
                      const duration = extractMeetingDuration(m);
                      const churchName = m.verificationSheet?.churchMinistryName;

                      return (
                        <div
                          key={m.id}
                          className="group/card rounded-xl p-2.5 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.10] border border-emerald-500/25 hover:border-emerald-500/60 hover:bg-emerald-500/[0.09] shadow-2xs hover:shadow-xs transition-all space-y-1.5 text-left cursor-pointer relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r-full" />

                          {/* 1. Header: Status & Duration (Separate Row to prevent text collision) */}
                          <div className="flex items-center justify-between gap-1 pl-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              CONFIRMED
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {duration.numberOfDays} {duration.numberOfDays > 1 ? "Days" : "Day"}
                            </span>
                          </div>

                          {/* 2. Village / Town Name (Full width, prominent, never overlaps with badges) */}
                          <div className="flex items-start gap-1.5 pt-0.5 pl-1">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-black text-xs sm:text-[13px] text-foreground tracking-tight leading-snug break-words [word-break:break-word] group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors block">
                                {villageTown}
                              </span>
                              {(districtName || churchName) && (
                                <span className="text-[10px] text-foreground/60 font-semibold leading-tight break-words [word-break:break-word] block mt-0.5">
                                  {districtName || churchName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 3. Session & Logistics Badges */}
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-emerald-500/15 pl-1">
                            <SessionBadge session={m.meetingSession} />
                            {m.travelMode && <TravelModeBadge mode={m.travelMode} details={m.travelOtherDetails} />}
                          </div>
                        </div>
                      );
                    })}

                    {/* Hold Meetings (Modern sleek card with amber accent border) */}
                    {dayData.hold.slice(0, Math.max(0, 2 - dayData.confirmed.length)).map((h: any) => {
                      const villageTown = extractVillageTownName(h);
                      const districtName = extractDistrictName(h);
                      const duration = extractMeetingDuration(h);

                      return (
                        <div
                          key={h.id}
                          className="group/card rounded-xl p-2.5 bg-amber-500/[0.05] dark:bg-amber-500/[0.10] border border-amber-500/25 hover:border-amber-500/60 hover:bg-amber-500/[0.09] shadow-2xs hover:shadow-xs transition-all space-y-1.5 text-left cursor-pointer relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r-full" />

                          {/* 1. Header: Status & Queue Info (Separate Row to prevent text collision) */}
                          <div className="flex items-center justify-between gap-1 pl-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              ON HOLD
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/25 shrink-0">
                              Queue #{h.queuePosition || 1} • {duration.numberOfDays}D
                            </span>
                          </div>

                          {/* 2. Village / Town Name (Full width, prominent) */}
                          <div className="flex items-start gap-1.5 pt-0.5 pl-1">
                            <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-black text-xs sm:text-[13px] text-foreground tracking-tight leading-snug break-words [word-break:break-word] group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400 transition-colors block">
                                {villageTown}
                              </span>
                              {districtName && (
                                <span className="text-[10px] text-foreground/60 font-semibold leading-tight break-words [word-break:break-word] block mt-0.5">
                                  {districtName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 3. Session */}
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-amber-500/15 pl-1">
                            <SessionBadge session={h.meetingSession} />
                          </div>
                        </div>
                      );
                    })}

                    {/* "+ More" indicator if more than 2 meetings */}
                    {totalMeetings > 2 && (
                      <div className="pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(dayItem.key);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-black text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <span>+{totalMeetings - 2} more meetings</span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                        </button>
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
        <div className="rounded-3xl border border-border/70 bg-card/50 backdrop-blur-md overflow-hidden shadow-sm">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-accent/30 text-center divide-x divide-border/20">
            {currentWeekDays.map((dayItem, idx) => {
              const isToday = dayItem.key === todayKey;
              return (
                <div key={dayItem.key} className="py-3 px-1">
                  <span className={`text-[11px] font-black tracking-widest uppercase block ${
                    idx === 0 || idx === 6 ? "text-primary" : "text-foreground/70"
                  }`}>
                    {WEEKDAY_NAMES[idx]}
                  </span>
                  <span className={`inline-flex items-center justify-center text-xs font-black rounded-xl mt-1 transition-all ${
                    isToday ? "h-7 w-7 bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20" : "h-7 w-7 text-foreground"
                  }`}>
                    {dayItem.dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 gap-[1px] bg-border/40 p-[1px] min-h-96">
            {currentWeekDays.map((dayItem) => {
              const dayData = dateBookingsMap.get(dayItem.key) || { confirmed: [], hold: [], cancelled: [] };
              const allBookings = [...dayData.confirmed, ...dayData.hold];

              return (
                <div 
                  key={dayItem.key} 
                  onClick={() => handleDateClick(dayItem.key)}
                  className="p-2 space-y-2 cursor-pointer bg-card/60 dark:bg-card/40 hover:bg-primary/[0.04] transition-colors flex flex-col justify-start"
                >
                  {allBookings.length === 0 ? (
                    <div className="py-20 text-center text-[11px] text-foreground/30 font-bold">
                      Available
                    </div>
                  ) : (
                    allBookings.map((b: any) => {
                      const villageTown = extractVillageTownName(b);
                      const districtName = extractDistrictName(b);
                      const duration = extractMeetingDuration(b);
                      const isConfirmed = b.status === "CONFIRMED";

                      return (
                        <div
                          key={b.id}
                          className={`p-2.5 rounded-xl border text-left shadow-2xs space-y-1.5 transition-all relative overflow-hidden group/card ${
                            isConfirmed
                              ? "bg-emerald-500/[0.06] dark:bg-emerald-500/[0.12] border-emerald-500/25 hover:border-emerald-500/60"
                              : "bg-amber-500/[0.06] dark:bg-amber-500/[0.12] border-amber-500/25 hover:border-amber-500/60"
                          }`}
                        >
                          <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${
                            isConfirmed ? "bg-emerald-500" : "bg-amber-500"
                          }`} />

                          <div className="flex items-center justify-between gap-1 pl-1">
                            <BookingStatusBadge status={b.status} />
                            <div className="flex items-center gap-1">
                              <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                {duration.numberOfDays}D
                              </span>
                              <SessionBadge session={b.meetingSession} />
                            </div>
                          </div>

                          <div className="flex items-start gap-1.5 min-w-0 pl-1">
                            <MapPin className={`h-3 w-3 shrink-0 mt-0.5 ${isConfirmed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
                            <h4 className="font-black text-xs sm:text-[13px] text-foreground tracking-tight leading-snug break-words [word-break:break-word]">
                              {villageTown}
                            </h4>
                          </div>

                          {districtName && (
                            <div className="text-[10px] text-foreground/60 font-semibold leading-tight break-words [word-break:break-word] pl-1">
                              {districtName}
                            </div>
                          )}

                          <div className="space-y-1 text-[10px] text-foreground/70 pt-1 border-t border-border/30 pl-1">
                            <div className="text-[10px] text-foreground/60 font-semibold truncate">
                              {b.clientName}
                            </div>
                            {b.travelMode && (
                              <TravelModeBadge mode={b.travelMode} details={b.travelOtherDetails} />
                            )}
                            {b.stayLocation && (
                              <div className="flex items-center gap-1 text-[9px] text-foreground/60 truncate">
                                <Hotel className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                                <span className="truncate">{b.stayLocation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
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
                    {dayData.confirmed.map((m: any) => {
                      const villageTown = extractVillageTownName(m);
                      const districtName = extractDistrictName(m);
                      const duration = extractMeetingDuration(m);
                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl border border-border/50 border-l-[4px] border-l-emerald-500 bg-card/90 space-y-2.5 shadow-2xs hover:shadow-xs transition-all text-left"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <h4 className="font-black text-sm text-foreground tracking-tight leading-snug break-words">
                                {villageTown}
                              </h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                {duration.numberOfDays} Day{duration.numberOfDays > 1 ? "s" : ""}
                              </span>
                              <BookingStatusBadge status="CONFIRMED" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80 pt-1">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-foreground/50 block">Requester / Client</span>
                              <span className="font-bold text-foreground leading-snug break-words block">{m.clientName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-foreground/50 block">District / Location</span>
                              <span className="font-medium text-foreground leading-snug break-words block">{districtName || m.verificationSheet?.district || "Local Region"}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/30">
                            <SessionBadge session={m.meetingSession} />
                            {m.phoneNumber && (
                              <a href={`tel:${m.phoneNumber}`} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {m.phoneNumber}
                              </a>
                            )}
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
                      );
                    })}

                    {/* Hold Meetings */}
                    {dayData.hold.map((h: any) => {
                      const villageTown = extractVillageTownName(h);
                      const districtName = extractDistrictName(h);
                      const duration = extractMeetingDuration(h);
                      return (
                        <div
                          key={h.id}
                          className="p-4 rounded-xl border border-border/50 border-l-[4px] border-l-amber-500 bg-card/90 space-y-2.5 shadow-2xs hover:shadow-xs transition-all text-left"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shrink-0">
                                #{h.queuePosition || 1}
                              </span>
                              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <h4 className="font-black text-sm text-foreground tracking-tight leading-snug break-words">
                                {villageTown}
                              </h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                {duration.numberOfDays} Day{duration.numberOfDays > 1 ? "s" : ""}
                              </span>
                              <BookingStatusBadge status="ON_HOLD" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80 pt-1">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-foreground/50 block">Requester / Client</span>
                              <span className="font-bold text-foreground leading-snug break-words block">{h.clientName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-foreground/50 block">District / Location</span>
                              <span className="font-medium text-foreground leading-snug break-words block">{districtName || "General Area"}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/30">
                            <SessionBadge session={h.meetingSession} />
                            {h.phoneNumber && (
                              <a href={`tel:${h.phoneNumber}`} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {h.phoneNumber}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

      {/* SECONDARY: DYNAMIC MONTHLY TRAVEL & TOUR ANALYTICS SUMMARY */}
      <div className="pt-4 border-t border-border/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                {MONTH_NAMES[month]} Tour & Booking Summary
              </h3>
              <p className="text-[10px] sm:text-[11px] text-foreground/50 font-medium">
                Aggregation of travel modes, hotel stays, confirmed meetings, and on-hold queues
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-accent text-foreground/70 border border-border/50 self-start sm:self-auto">
            {monthlyStats.total} Meetings • {monthlyStats.totalTravelDays} Active Days
          </span>
        </div>

        {/* 1. Monthly KPI Stat Cards */}
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

        {/* 2. Tour Breakdown Chips */}
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
      </div>

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
                    selectedDateData.confirmed.map((booking: any) => {
                      const villageTown = extractVillageTownName(booking);
                      const districtName = extractDistrictName(booking);
                      const stateDist = [districtName || booking.verificationSheet?.district, booking.verificationSheet?.state].filter(Boolean).join(", ");
                      const duration = extractMeetingDuration(booking);
                      const requesterName = booking.verificationSheet?.convenerName || booking.clientName;
                      const coordinatorName = booking.verificationSheet?.meetingReport?.leader?.name || booking.verificationSheet?.meetingReport?.leader?.username;
                      const churchName = booking.verificationSheet?.churchMinistryName;

                      return (
                        <div
                          key={booking.id}
                          className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-card/90 space-y-4 shadow-xs border-l-[4px] border-l-emerald-500"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <h4 className="text-base sm:text-lg font-black text-foreground tracking-tight break-words">
                                  {villageTown}
                                </h4>
                                <BookingStatusBadge status="CONFIRMED" />
                              </div>
                              <p className="text-xs text-foreground/60 font-semibold mt-0.5">
                                {stateDist || normalizePlaceName(booking.meetingCity)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                {duration.numberOfDays} Day{duration.numberOfDays > 1 ? "s" : ""}
                              </span>
                              <SessionBadge session={booking.meetingSession} />
                              {booking.travelMode && (
                                <TravelModeBadge mode={booking.travelMode} details={booking.travelOtherDetails} />
                              )}
                            </div>
                          </div>

                          {/* 4 CORE EXECUTIVE MEETING HIGHLIGHTS (Location, Stay, Travel, Duration) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-accent/30 border border-border/50 text-xs">
                            {/* 1. LOCATION */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Location</span>
                              </div>
                              <div className="font-black text-sm text-foreground break-words leading-snug">
                                {villageTown}
                              </div>
                              <div className="text-[11px] text-foreground/70 font-semibold break-words leading-tight">
                                {stateDist || "Location Assigned"}
                              </div>
                            </div>

                            {/* 2. STAY / ACCOMMODATION */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                <Hotel className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Stay / Hotel</span>
                              </div>
                              <div className="font-bold text-xs text-foreground break-words leading-snug">
                                {booking.stayLocation || "Not specified"}
                              </div>
                              <div className="text-[10px] text-foreground/60 font-medium">
                                {booking.stayLocation ? "Confirmed Accommodation" : "Pending Arrangement"}
                              </div>
                            </div>

                            {/* 3. TRAVEL / LOGISTICS */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                <Navigation className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Travel</span>
                              </div>
                              <div className="font-bold text-xs text-foreground break-words leading-snug">
                                {booking.travelMode || "Direct Travel"}
                              </div>
                              <div className="text-[10px] text-foreground/60 font-medium break-words leading-tight">
                                {booking.travelOtherDetails || (booking.travelMode ? `${booking.travelMode} Route` : "Local Transit")}
                              </div>
                            </div>

                            {/* 4. DURATION (HOW MANY DAYS) */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">How Many Days</span>
                              </div>
                              <div className="font-black text-sm text-foreground">
                                {duration.numberOfDays} Day{duration.numberOfDays > 1 ? "s" : ""}
                              </div>
                              <div className="text-[10px] text-foreground/60 font-medium break-words leading-tight">
                                {duration.datesLabel}
                              </div>
                            </div>
                          </div>

                          {/* Secondary Ministry Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Meeting Person / Requester</span>
                              <div className="flex items-center gap-1 font-bold text-foreground truncate">
                                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{requesterName}</span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Church / Ministry</span>
                              <div className="flex items-center gap-1 font-semibold text-foreground truncate">
                                <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span>{churchName || "Local Outreach"}</span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Assigned Coordinator / Leader</span>
                              <div className="flex items-center gap-1 font-bold text-foreground truncate">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span>{coordinatorName ? `@${coordinatorName}` : "General Leadership"}</span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Phone Number</span>
                              <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                                <a href={`tel:${booking.phoneNumber}`} className="text-primary hover:underline">
                                  {booking.phoneNumber}
                                </a>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Expected Attendance</span>
                              <div className="font-semibold text-foreground">
                                {booking.verificationSheet?.expectedAttendance ? `${booking.verificationSheet.expectedAttendance} Attendees` : "N/A"}
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Verification Status</span>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {booking.verificationSheet?.status || "VERIFIED"}
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View Verification Form</span>
                                </button>
                              )}
                              <a
                                href={`tel:${booking.phoneNumber}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-accent text-xs font-bold transition-all"
                              >
                                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Call Client</span>
                              </a>
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
                      );
                    })
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
                    selectedDateData.hold.map((booking: any) => {
                      const villageTown = extractVillageTownName(booking);
                      const districtName = extractDistrictName(booking);
                      const stateDist = [districtName || booking.verificationSheet?.district, booking.verificationSheet?.state].filter(Boolean).join(", ");
                      const duration = extractMeetingDuration(booking);
                      const requesterName = booking.verificationSheet?.convenerName || booking.clientName;

                      return (
                        <div
                          key={booking.id}
                          className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-card/90 space-y-4 shadow-xs border-l-[4px] border-l-amber-500"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                                Queue #{booking.queuePosition || 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <h4 className="text-base font-black text-foreground tracking-tight">
                                    {villageTown}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-foreground/60 font-medium">
                                  Priority: <span className="font-bold text-amber-600 dark:text-amber-400">{booking.priority || "MEDIUM"}</span> • {stateDist || normalizePlaceName(booking.meetingCity)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                {duration.numberOfDays} Day{duration.numberOfDays > 1 ? "s" : ""}
                              </span>
                              <SessionBadge session={booking.meetingSession} />
                              {booking.travelMode && (
                                <TravelModeBadge mode={booking.travelMode} details={booking.travelOtherDetails} />
                              )}
                            </div>
                          </div>

                          {/* 4 CORE EXECUTIVE MEETING HIGHLIGHTS (Location, Stay, Travel, Duration) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-accent/30 border border-border/50 text-xs">
                            {/* 1. LOCATION */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Location</span>
                              </div>
                              <div className="font-black text-sm text-foreground break-words leading-snug">
                                {villageTown}
                              </div>
                              <div className="text-[11px] text-foreground/70 font-semibold break-words leading-tight">
                                {stateDist || "Location Assigned"}
                              </div>
                            </div>

                            {/* 2. STAY / ACCOMMODATION */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                <Hotel className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Stay / Hotel</span>
                              </div>
                              <div className="font-bold text-xs text-foreground break-words leading-snug">
                                {booking.stayLocation || "Not specified"}
                              </div>
                              <div className="text-[10px] text-foreground/60 font-medium">
                                {booking.stayLocation ? "Requested Accommodation" : "Pending Arrangement"}
                              </div>
                            </div>

                            {/* 3. TRAVEL / LOGISTICS */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                <Navigation className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Travel</span>
                              </div>
                              <div className="font-bold text-xs text-foreground break-words leading-snug">
                                {booking.travelMode || "Direct Travel"}
                              </div>
                              <div className="text-[10px] text-foreground/60 font-medium break-words leading-tight">
                                {booking.travelOtherDetails || (booking.travelMode ? `${booking.travelMode} Route` : "Local Transit")}
                              </div>
                            </div>

                            {/* 4. DURATION (HOW MANY DAYS) */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-wider">How Many Days</span>
                              </div>
                              <div className="font-black text-sm text-foreground">
                                {duration.numberOfDays} Day{duration.numberOfDays > 1 ? "s" : ""}
                              </div>
                              <div className="text-[10px] text-foreground/60 font-medium break-words leading-tight">
                                {duration.datesLabel}
                              </div>
                            </div>
                          </div>

                          {/* Secondary Requester & Contact Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Requester / Client</span>
                              <div className="font-bold text-foreground truncate">
                                {requesterName}
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-foreground/50">Phone Number</span>
                              <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                                <a href={`tel:${booking.phoneNumber}`} className="text-primary hover:underline">
                                  {booking.phoneNumber}
                                </a>
                              </div>
                            </div>

                            {booking.holdReason && (
                              <div className="space-y-0.5 sm:col-span-1">
                                <span className="text-[10px] font-black uppercase text-foreground/50">Hold Reason</span>
                                <div className="text-foreground font-medium truncate">
                                  {booking.holdReason}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleConfirmHoldBooking(booking)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Promote to Confirmed</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
                              >
                                Remove from Hold
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
