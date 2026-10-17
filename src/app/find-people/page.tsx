"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { 
  Search, Users, Phone, Mail, MapPin, 
  FileText, Calendar, CheckCircle2, 
  Clock, Shield, X, ExternalLink, RefreshCw, Copy,
  Download, ZoomIn, Eye
} from "lucide-react";
import { toast } from "sonner";

interface Candidate {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  image?: string | null;
  role: "ADMIN" | "STATE_LEADER" | "ZONE_LEADER" | "COORDINATOR";
  state?: string | null;
  zone?: string | null;
  part?: string | null;
  createdAt: string;
  _count?: {
    meetingReports: number;
  };
}

interface CandidateProfile extends Candidate {
  meetingReports?: {
    id: string;
    reportId: string;
    status: string;
    submittedAt?: string | null;
    attendanceRecord?: {
      date: string;
      location: string;
      membersAttended: number;
      pastorsAttended: number;
    } | null;
  }[];
}

export default function FindPeoplePage() {
  const { user } = useUIStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  
  // Profile modal state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Full Image Viewer & Download modal state
  const [viewingImage, setViewingImage] = useState<{
    imageUrl: string;
    name: string;
    username: string;
    role: string;
  } | null>(null);

  const fetchCandidates = async (query = "", role = "ALL") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append("search", query.trim());
      if (role && role !== "ALL") params.append("role", role);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load people");
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || "Error loading people");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(searchQuery, roleFilter);
  }, [roleFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCandidates(searchQuery, roleFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleOpenProfile = async (id: string) => {
    setSelectedCandidateId(id);
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error("Failed to load candidate profile");
      const data = await res.json();
      setCandidateProfile(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load candidate profile");
      setSelectedCandidateId(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDownloadImage = (imgData: { imageUrl: string; name: string; username: string }) => {
    try {
      const link = document.createElement("a");
      link.href = imgData.imageUrl;
      const safeName = (imgData.name || imgData.username || "candidate")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");
      link.download = `${safeName}_profile.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Profile picture of ${imgData.name || imgData.username} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download profile image");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "System Admin",
          className: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        };
      case "STATE_LEADER":
        return {
          label: "State Leader",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        };
      case "ZONE_LEADER":
        return {
          label: "Zone Leader",
          className: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
        };
      default:
        return {
          label: "Coordinator",
          className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        };
    }
  };

  const scopeDescription = useMemo(() => {
    if (user?.role === "ADMIN") {
      return "Ministry-Wide Directory: Search and view all leaders, coordinators, and candidates across all states and zones.";
    }
    if (user?.role === "STATE_LEADER") {
      return `State Directory (${user.state || "Your State"}): Search and view all Zone Leaders and Coordinators in your state.`;
    }
    if (user?.role === "ZONE_LEADER") {
      return `Zone Directory (${user.zone || "Your Zone"}): Search and view all Coordinators assigned to your zone.`;
    }
    return "Member Directory";
  }, [user]);

  // Allowed role filters based on current user's authority
  const allowedRoles = useMemo(() => {
    if (user?.role === "ADMIN") {
      return [
        { label: "All Roles", value: "ALL" },
        { label: "State Leaders", value: "STATE_LEADER" },
        { label: "Zone Leaders", value: "ZONE_LEADER" },
        { label: "Coordinators", value: "COORDINATOR" },
        { label: "Admins", value: "ADMIN" },
      ];
    }
    if (user?.role === "STATE_LEADER") {
      return [
        { label: "All Members", value: "ALL" },
        { label: "Zone Leaders", value: "ZONE_LEADER" },
        { label: "Coordinators", value: "COORDINATOR" },
      ];
    }
    return [
      { label: "All Coordinators", value: "ALL" },
    ];
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn text-left">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Find People
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {scopeDescription}
            </p>
          </div>

          <button
            onClick={() => fetchCandidates(searchQuery, roleFilter)}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.96] shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by candidate name or phone number..."
                className="w-full pl-10 pr-10 py-2.5 min-h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 text-base sm:text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="md:col-span-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full py-2.5 px-3 min-h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 text-base sm:text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {allowedRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-1 pt-1">
            <span>
              Found <strong className="text-slate-800 dark:text-white">{candidates.length}</strong> candidate{candidates.length === 1 ? "" : "s"}
            </span>
            {searchQuery && (
              <span className="text-blue-600 dark:text-blue-400 truncate max-w-50">
                Filtered by: "{searchQuery}"
              </span>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Searching people...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Candidates Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              We couldn't find anyone matching your search criteria. Try a different name, phone number, or clear your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {candidates.map((candidate) => {
              const badge = getRoleBadge(candidate.role);
              const initials = (candidate.name || candidate.username)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={candidate.id}
                  onClick={() => handleOpenProfile(candidate.id)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group cursor-pointer"
                >
                  {/* Candidate Header */}
                  <div className="flex items-start gap-3.5">
                    {candidate.image ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingImage({
                            imageUrl: candidate.image!,
                            name: candidate.name || candidate.username,
                            username: candidate.username,
                            role: candidate.role,
                          });
                        }}
                        className="relative group/avatar shrink-0 cursor-pointer"
                        title="Click to view full photo & download"
                      >
                        <img
                          src={candidate.image}
                          alt={candidate.name || candidate.username}
                          className="h-12 w-12 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-800 group-hover/avatar:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-black/35 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {candidate.name || candidate.username}
                        </h4>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400 truncate">
                        @{candidate.username}
                      </p>
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                    {/* Phone Number */}
                    <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-2 text-slate-400 font-semibold truncate">
                        <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        Phone:
                      </span>
                      {candidate.phoneNumber ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${candidate.phoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {candidate.phoneNumber}
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(candidate.phoneNumber!, "Phone number");
                            }}
                            title="Copy Phone Number"
                            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not Added</span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-2 text-slate-400 font-semibold truncate">
                        <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        Email:
                      </span>
                      <a
                        href={`mailto:${candidate.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 truncate max-w-42.5"
                      >
                        {candidate.email}
                      </a>
                    </div>

                    {/* Region */}
                    <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-2 text-slate-400 font-semibold shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        Region:
                      </span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] truncate text-right">
                        {[
                          candidate.state ? `State: ${candidate.state}` : null,
                          candidate.zone ? `Zone: ${candidate.zone}` : null,
                          candidate.part ? `Part: ${candidate.part}` : null,
                        ].filter(Boolean).join(" | ") || "Global"}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      {candidate._count?.meetingReports ?? 0} Reports
                    </span>
                    <div className="flex items-center gap-1.5">
                      {candidate.image && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImage({
                              imageUrl: candidate.image!,
                              name: candidate.name || candidate.username,
                              username: candidate.username,
                              role: candidate.role,
                            });
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View & Download Profile Photo"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProfile(candidate.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-[0.96]"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Candidate Profile Modal */}
        {selectedCandidateId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col text-left overflow-hidden max-h-[90vh] my-auto">
              {profileLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Candidate Profile...</p>
                </div>
              ) : candidateProfile ? (
                <>
                  {/* Modal Header Banner */}
                  <div className="relative bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCandidateId(null);
                        setCandidateProfile(null);
                      }}
                      className="absolute right-4 top-4 rounded-xl p-1.5 bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-4">
                      {candidateProfile.image ? (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingImage({
                              imageUrl: candidateProfile.image!,
                              name: candidateProfile.name || candidateProfile.username,
                              username: candidateProfile.username,
                              role: candidateProfile.role,
                            });
                          }}
                          className="relative group/modalAvatar shrink-0 cursor-pointer"
                          title="Click to view full photo & download"
                        >
                          <img
                            src={candidateProfile.image}
                            alt={candidateProfile.name || candidateProfile.username}
                            className="h-16 w-16 rounded-2xl object-cover border-2 border-white/40 shadow-lg group-hover/modalAvatar:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-black/35 opacity-0 group-hover/modalAvatar:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="h-5 w-5 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                          {(candidateProfile.name || candidateProfile.username)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-xl font-black truncate">
                          {candidateProfile.name || candidateProfile.username}
                        </h3>
                        <p className="text-xs text-white/80 font-medium truncate">
                          @{candidateProfile.username}
                        </p>
                        <div className="mt-1.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30">
                            {candidateProfile.role.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Body */}
                  <div className="p-4 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Contact & Jurisdiction Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Phone className="h-3.5 w-3.5 text-blue-500" />
                          Phone Number
                        </span>
                        {candidateProfile.phoneNumber ? (
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={`tel:${candidateProfile.phoneNumber}`}
                              className="text-sm font-black text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {candidateProfile.phoneNumber}
                            </a>
                            <button
                              onClick={() => copyToClipboard(candidateProfile.phoneNumber!, "Phone number")}
                              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400 italic">No phone number recorded</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-indigo-500" />
                          Email Address
                        </span>
                        <a
                          href={`mailto:${candidateProfile.email}`}
                          className="text-sm font-black text-slate-800 dark:text-white hover:underline truncate block"
                        >
                          {candidateProfile.email}
                        </a>
                      </div>

                      {/* Location Jurisdiction */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1 sm:col-span-2">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          Ministry Jurisdiction
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            State: {candidateProfile.state || "All / None"}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            Zone: {candidateProfile.zone || "All / None"}
                          </span>
                          {candidateProfile.part && (
                            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              Part: {candidateProfile.part}
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            Joined: {new Date(candidateProfile.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Activity & Performance */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Meeting Reports Activity
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 rounded-xl">
                          <p className="text-xs font-bold uppercase text-slate-400">Total Reports</p>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                            {candidateProfile._count?.meetingReports ?? 0}
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 rounded-xl">
                          <p className="text-xs font-bold uppercase text-slate-400">Approved Reports</p>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {candidateProfile.meetingReports?.filter((r) => r.status === "APPROVED").length ?? 0}
                          </p>
                        </div>
                      </div>

                      {/* Recent reports list */}
                      {candidateProfile.meetingReports && candidateProfile.meetingReports.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Recent Submissions
                          </p>
                          <div className="space-y-2">
                            {candidateProfile.meetingReports.map((r) => (
                              <div
                                key={r.id}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-white block">
                                    {r.reportId}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {r.attendanceRecord?.location || "Outreach Meeting"} • {r.attendanceRecord?.membersAttended || 0} attendees
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  r.status === "APPROVED" 
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                }`}>
                                  {r.status.replace(/_/g, " ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">
                          No meeting reports submitted yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {candidateProfile.phoneNumber && (
                        <a
                          href={`tel:${candidateProfile.phoneNumber}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call Candidate
                        </a>
                      )}
                      <a
                        href={`mailto:${candidateProfile.email}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Send Email
                      </a>
                      {candidateProfile.image && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingImage({
                              imageUrl: candidateProfile.image!,
                              name: candidateProfile.name || candidateProfile.username,
                              username: candidateProfile.username,
                              role: candidateProfile.role,
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download Photo
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCandidateId(null);
                        setCandidateProfile(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Full Image Viewer & Download Modal */}
        {viewingImage && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
            onClick={() => setViewingImage(null)}
          >
            <div 
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white animate-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800">
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">{viewingImage.name || viewingImage.username}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">
                    @{viewingImage.username} &bull; {viewingImage.role.replace(/_/g, " ")}
                  </p>
                </div>
                <button
                  onClick={() => setViewingImage(null)}
                  className="rounded-xl p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Image Viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Full Image Container */}
              <div className="p-6 flex items-center justify-center bg-black/50 min-h-65 max-h-[60vh] overflow-hidden">
                <img
                  src={viewingImage.imageUrl}
                  alt={viewingImage.name || viewingImage.username}
                  className="max-h-[50vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
                />
              </div>

              {/* Download Prompt / Action Bar */}
              <div className="p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-200">
                    High-Resolution Profile Photo
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Would you like to download this profile picture to your device?
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadImage(viewingImage)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download Photo
                  </button>
                  <button
                    onClick={() => setViewingImage(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
