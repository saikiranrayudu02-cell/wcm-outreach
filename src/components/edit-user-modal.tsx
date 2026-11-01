"use client";

import React, { useState, useEffect } from "react";
import { X, Pencil, MapPin, Layers, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatRoleBadge } from "@/lib/translations";

interface EditUserModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [states, setStates] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setPhoneNumber(user.phoneNumber || "");
      setEmail(user.email || "");
      setSelectedStateId(user.stateId || "");
      setSelectedZoneId(user.zoneId || "");
      setSelectedDistrictId(user.districtId || "");
      fetchStates();
    }
  }, [user, isOpen]);

  const fetchStates = async () => {
    try {
      const res = await fetch("/api/admin/hierarchy/states");
      if (res.ok) {
        const data = await res.json();
        setStates(data);
      }
    } catch {
      console.error("Failed to load states");
    }
  };

  useEffect(() => {
    if (!selectedStateId) {
      setZones([]);
      return;
    }
    const fetchZones = async () => {
      try {
        const res = await fetch(`/api/admin/hierarchy/zones?stateId=${selectedStateId}`);
        if (res.ok) {
          const data = await res.json();
          setZones(data);
        }
      } catch {
        console.error("Failed to load zones");
      }
    };
    fetchZones();
  }, [selectedStateId]);

  useEffect(() => {
    if (!selectedZoneId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await fetch(`/api/admin/hierarchy/districts?zoneId=${selectedZoneId}`);
        if (res.ok) {
          const data = await res.json();
          setDistricts(data);
        }
      } catch {
        console.error("Failed to load districts");
      }
    };
    fetchDistricts();
  }, [selectedZoneId]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim() || null,
          email: email.trim() || null,
          stateId: selectedStateId || null,
          zoneId: selectedZoneId || null,
          districtId: selectedDistrictId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update user");
        return;
      }

      toast.success(data.message || "User updated successfully");
      onUserUpdated?.();
      onClose();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 text-left animate-modal max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50">
              <Pencil className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Edit User Details: {user.username}
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold block">
                Role: {formatRoleBadge(user.role)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
            />
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              />
            </div>
          </div>

          {/* Hierarchy Reassignment (If applicable) */}
          {user.role !== "ADMIN" && (
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 block">
                Geographic Territory Assignment
              </span>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">State</label>
                <select
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">-- Unassigned --</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {(user.role === "ZONE_LEADER" || user.role === "COORDINATOR") && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Zone</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {user.role === "COORDINATOR" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">District</label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
