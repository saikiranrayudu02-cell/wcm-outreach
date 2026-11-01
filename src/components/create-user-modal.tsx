"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, ShieldAlert, CheckCircle2, AlertCircle, Plus, Users, MapPin, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [states, setStates] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Form Fields
  const [selectedStateId, setSelectedStateId] = useState("");
  const [role, setRole] = useState<"STATE_LEADER" | "ZONE_LEADER" | "COORDINATOR">("COORDINATOR");

  // Zone selection mode: existing vs new
  const [zoneMode, setZoneMode] = useState<"existing" | "new">("existing");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [newZoneName, setNewZoneName] = useState("");

  // District selection mode: existing vs new
  const [districtMode, setDistrictMode] = useState<"existing" | "new">("existing");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [newDistrictName, setNewDistrictName] = useState("");

  // Active Zonal Leader detection for Coordinator creation
  const [activeZonalLeader, setActiveZonalLeader] = useState<any | null>(null);
  const [checkingLeader, setCheckingLeader] = useState(false);

  // User credentials
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Existing leader conflict override
  const [existingLeaderConflict, setExistingLeaderConflict] = useState<any | null>(null);
  const [replaceExistingLeader, setReplaceExistingLeader] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load States on open
  useEffect(() => {
    if (isOpen) {
      fetchStates();
    }
  }, [isOpen]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const res = await fetch("/api/admin/hierarchy/states");
      if (res.ok) {
        const data = await res.json();
        setStates(data);
        if (data.length > 0 && !selectedStateId) {
          // Default to Andhra Pradesh if present, or first state
          const ap = data.find((s: any) => s.name === "Andhra Pradesh");
          setSelectedStateId(ap ? ap.id : data[0].id);
        }
      }
    } catch {
      toast.error("Failed to load states list");
    } finally {
      setLoadingStates(false);
    }
  };

  // Load Zones when State changes
  useEffect(() => {
    if (!selectedStateId) {
      setZones([]);
      setSelectedZoneId("");
      return;
    }

    const fetchZones = async () => {
      setLoadingZones(true);
      try {
        const res = await fetch(`/api/admin/hierarchy/zones?stateId=${selectedStateId}`);
        if (res.ok) {
          const data = await res.json();
          setZones(data);
          if (data.length > 0) {
            setSelectedZoneId(data[0].id);
            setZoneMode("existing");
          } else {
            setSelectedZoneId("");
            setZoneMode("new");
          }
        }
      } catch {
        toast.error("Failed to load zones for state");
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, [selectedStateId]);

  // Load Districts and verify Zonal Leader when Zone changes
  useEffect(() => {
    if (role === "STATE_LEADER") {
      setActiveZonalLeader(null);
      setDistricts([]);
      return;
    }

    if (!selectedZoneId || zoneMode === "new") {
      setDistricts([]);
      setSelectedDistrictId("");
      setActiveZonalLeader(null);
      return;
    }

    const fetchDistrictsAndLeader = async () => {
      setLoadingDistricts(true);
      setCheckingLeader(true);
      try {
        // Fetch districts
        const distRes = await fetch(`/api/admin/hierarchy/districts?zoneId=${selectedZoneId}`);
        if (distRes.ok) {
          const distData = await distRes.json();
          setDistricts(distData);
          if (distData.length > 0) {
            setSelectedDistrictId(distData[0].id);
            setDistrictMode("existing");
          } else {
            setSelectedDistrictId("");
            setDistrictMode("new");
          }
        }

        // Find active Zonal Leader for this zone
        const selectedZoneObj = zones.find((z) => z.id === selectedZoneId);
        if (selectedZoneObj && selectedZoneObj.zonalLeader) {
          setActiveZonalLeader(selectedZoneObj.zonalLeader);
        } else {
          setActiveZonalLeader(null);
        }
      } catch {
        console.error("Failed to load districts/leader");
      } finally {
        setLoadingDistricts(false);
        setCheckingLeader(false);
      }
    };

    fetchDistrictsAndLeader();
  }, [selectedZoneId, zoneMode, role, zones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStateId) {
      toast.error("Please select a State");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (role === "COORDINATOR" && !activeZonalLeader) {
      toast.error("Cannot create Coordinator: No active Zonal Leader in this Zone.");
      return;
    }

    setSubmitting(true);
    setExistingLeaderConflict(null);

    try {
      const payload: any = {
        name,
        username,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        password,
        confirmPassword,
        role,
        stateId: selectedStateId,
        replaceExistingLeader,
      };

      if (role === "ZONE_LEADER") {
        if (zoneMode === "new") {
          payload.newZoneName = newZoneName.trim();
        } else {
          payload.zoneId = selectedZoneId;
        }
      } else if (role === "COORDINATOR") {
        if (zoneMode === "new") {
          payload.newZoneName = newZoneName.trim();
        } else {
          payload.zoneId = selectedZoneId;
        }

        if (districtMode === "new") {
          payload.newDistrictName = newDistrictName.trim();
        } else {
          payload.districtId = selectedDistrictId;
        }
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EXISTING_LEADER_CONFLICT") {
          setExistingLeaderConflict(data);
          toast.warning(data.error);
        } else {
          toast.error(data.error || "Failed to create user");
        }
        return;
      }

      toast.success(data.message || "User created successfully!");
      onUserCreated();
      onClose();
    } catch {
      toast.error("An unexpected error occurred while creating user");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 text-left max-h-[92vh] overflow-y-auto animate-modal my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Create New Ministry User
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dynamic role-based hierarchy assignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: SELECT STATE */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Step 1: Select State *
            </label>
            <select
              required
              value={selectedStateId}
              onChange={(e) => {
                setSelectedStateId(e.target.value);
                setExistingLeaderConflict(null);
              }}
              disabled={loadingStates}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-bold cursor-pointer transition-all"
            >
              <option value="" disabled>-- Select Ministry State --</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""} {s.stateLeader ? `• Leader: ${s.stateLeader.name}` : "• No Active Leader"}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: SELECT ROLE */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Step 2: Select Role *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { r: "STATE_LEADER", label: "State Leader", desc: "State-wide oversight" },
                { r: "ZONE_LEADER", label: "Zonal Leader", desc: "Zone & coordinator head" },
                { r: "COORDINATOR", label: "Coordinator", desc: "District field executor" },
              ].map((item) => {
                const isSelected = role === item.r;
                return (
                  <button
                    type="button"
                    key={item.r}
                    onClick={() => {
                      setRole(item.r as any);
                      setExistingLeaderConflict(null);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400 font-medium"
                    }`}
                  >
                    <span className="block text-xs font-black uppercase tracking-wider">{item.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DEPENDENT FIELDS: ZONE SELECTION (For ZONAL_LEADER & COORDINATOR) */}
          {(role === "ZONE_LEADER" || role === "COORDINATOR") && (
            <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  Zone Assignment *
                </label>
                <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setZoneMode("existing")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      zoneMode === "existing" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoneMode("new")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      zoneMode === "new" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    + Create New
                  </button>
                </div>
              </div>

              {zoneMode === "existing" ? (
                <select
                  required
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  disabled={loadingZones || zones.length === 0}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer"
                >
                  <option value="" disabled>-- Select Zone --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} {z.zonalLeader ? `(Leader: ${z.zonalLeader.name})` : "(No Zonal Leader)"}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter new zone name (e.g. Zone 5)"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Will be created under the selected State.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* DEPENDENT FIELDS: DISTRICT SELECTION (Only for COORDINATOR) */}
          {role === "COORDINATOR" && (
            <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  District Assignment *
                </label>
                <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDistrictMode("existing")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      districtMode === "existing" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistrictMode("new")}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      districtMode === "new" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    + Create New
                  </button>
                </div>
              </div>

              {districtMode === "existing" ? (
                <select
                  required
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  disabled={loadingDistricts || districts.length === 0}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer"
                >
                  <option value="" disabled>-- Select District --</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.coordinatorsCount} Coordinators)
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter new district name (e.g. Konaseema)"
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Will be created under the selected Zone.
                  </span>
                </div>
              )}

              {/* ACTIVE ZONAL LEADER VALIDATION BADGE */}
              <div className="pt-2">
                {checkingLeader ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Checking Zonal Leader assignment...
                  </div>
                ) : activeZonalLeader ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                          Responsible Zonal Leader: {activeZonalLeader.name} (@{activeZonalLeader.username})
                        </span>
                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                          Coordinator will be linked to this leader's team.
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/50 dark:border-amber-700/50 flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                        No Active Zonal Leader Found for this Zone!
                      </span>
                      <p className="text-[11px] text-amber-700/90 dark:text-amber-400 font-medium mt-0.5 leading-relaxed">
                        A responsible Zonal Leader must be assigned to this Zone before you can add Coordinators. Please create or assign a Zonal Leader first.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONFLICT OVERRIDE CARD (If state or zone already has leader) */}
          {existingLeaderConflict && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-left animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Active Leadership Assignment Conflict
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                    {existingLeaderConflict.error}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={replaceExistingLeader}
                      onChange={(e) => setReplaceExistingLeader(e.target.checked)}
                      className="rounded border-amber-400 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Yes, safely replace the existing leader and reassign authority to this new user.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* USER CREDENTIAL FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pastor Samuel"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. samuel_pastor"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="samuel@wcmoutreach.org"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (role === "COORDINATOR" && !activeZonalLeader)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? "Creating User..." : `Create ${role.replace("_", " ")}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
