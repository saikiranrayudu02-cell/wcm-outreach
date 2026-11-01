"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronRight, ChevronDown, Users, MapPin, Shield, CheckCircle2, 
  XCircle, Search, RefreshCw, KeyRound, Power, Pencil, 
  Layers, Building2, UserCheck, ShieldAlert, Sparkles, Filter
} from "lucide-react";
import { toast } from "sonner";
import { formatRoleBadge } from "@/lib/translations";

interface AdminHierarchyTreeProps {
  onEditUser?: (user: any) => void;
  onResetPassword?: (user: any) => void;
  onToggleStatus?: (user: any) => void;
}

export function AdminHierarchyTree({ onEditUser, onResetPassword, onToggleStatus }: AdminHierarchyTreeProps) {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Expanded nodes state: stateIds, zoneIds, districtIds
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hierarchy/tree");
      if (res.ok) {
        const data = await res.json();
        setTreeData(data.tree || []);
        setSummary(data.summary || {});

        // Auto-expand first state or Andhra Pradesh by default
        if (data.tree && data.tree.length > 0) {
          const ap = data.tree.find((s: any) => s.name === "Andhra Pradesh") || data.tree[0];
          setExpandedStates({ [ap.id]: true });

          // Also auto-expand Zone 3 if present
          if (ap.zones && ap.zones.length > 0) {
            const z3 = ap.zones.find((z: any) => z.name === "Zone 3") || ap.zones[0];
            setExpandedZones({ [z3.id]: true });
          }
        }
      }
    } catch {
      toast.error("Failed to load organizational hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleState = (id: string) => {
    setExpandedStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleZone = (id: string) => {
    setExpandedZones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDistrict = (id: string) => {
    setExpandedDistricts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const sMap: Record<string, boolean> = {};
    const zMap: Record<string, boolean> = {};
    const dMap: Record<string, boolean> = {};
    treeData.forEach((s) => {
      sMap[s.id] = true;
      s.zones?.forEach((z: any) => {
        zMap[z.id] = true;
        z.districts?.forEach((d: any) => {
          dMap[d.id] = true;
        });
      });
    });
    setExpandedStates(sMap);
    setExpandedZones(zMap);
    setExpandedDistricts(dMap);
  };

  const collapseAll = () => {
    setExpandedStates({});
    setExpandedZones({});
    setExpandedDistricts({});
  };

  // Filter tree based on search query
  const filteredTree = treeData.filter((state) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchState = state.name.toLowerCase().includes(q);
    const matchStateLeader = state.stateLeader?.name?.toLowerCase().includes(q) || state.stateLeader?.username?.toLowerCase().includes(q);
    const matchZone = state.zones?.some((z: any) =>
      z.name.toLowerCase().includes(q) ||
      z.zonalLeader?.name?.toLowerCase().includes(q) ||
      z.zonalLeader?.username?.toLowerCase().includes(q) ||
      z.districts?.some((d: any) =>
        d.name.toLowerCase().includes(q) ||
        d.coordinators?.some((c: any) => c.name?.toLowerCase().includes(q) || c.username?.toLowerCase().includes(q))
      )
    );
    return matchState || matchStateLeader || matchZone;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "States", count: summary.totalStates ?? 0, icon: MapPin, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200/60" },
          { label: "Zones", count: summary.totalZones ?? 0, icon: Layers, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60" },
          { label: "Districts", count: summary.totalDistricts ?? 0, icon: Building2, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200/60" },
          { label: "State Leaders", count: summary.totalStateLeaders ?? 0, icon: Shield, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60" },
          { label: "Zonal Leaders", count: summary.totalZonalLeaders ?? 0, icon: UserCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60" },
          { label: "Coordinators", count: summary.totalCoordinators ?? 0, icon: Users, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200/60" },
        ].map((m, idx) => (
          <div key={idx} className={`p-3.5 rounded-2xl border ${m.color} flex items-center gap-3 shadow-xs`}>
            <m.icon className="h-5 w-5 shrink-0" />
            <div>
              <span className="text-lg font-black block tracking-tight">{m.count}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search State, Zone, District, Leader, Coordinator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Collapse All
          </button>
          <button
            onClick={fetchTree}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Tree Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tree Column */}
        <div className="lg:col-span-8 space-y-3">
          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading organizational tree...</span>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
              No matching organizational branches found.
            </div>
          ) : (
            filteredTree.map((state) => {
              const isStateExpanded = Boolean(expandedStates[state.id]);

              return (
                <div
                  key={state.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden transition-all"
                >
                  {/* STATE HEADER */}
                  <div
                    onClick={() => toggleState(state.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-transparent transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {isStateExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {state.name}
                        </span>
                        {state.code && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/40">
                            {state.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {state.stateLeader ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntity({ type: "STATE_LEADER", data: state.stateLeader, stateName: state.name });
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/50 flex items-center gap-1.5 text-xs font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                        >
                          <Shield className="h-3 w-3" />
                          <span>Leader: {state.stateLeader.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider italic">
                          No State Leader
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-400">
                        {state.zonesCount} Zones
                      </span>
                    </div>
                  </div>

                  {/* ZONES UNDER STATE */}
                  {isStateExpanded && (
                    <div className="p-3 pl-6 sm:pl-8 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn">
                      {state.zones.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-2 pl-4">No zones created in this state yet.</div>
                      ) : (
                        state.zones.map((zone: any) => {
                          const isZoneExpanded = Boolean(expandedZones[zone.id]);

                          return (
                            <div
                              key={zone.id}
                              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                            >
                              {/* ZONE HEADER */}
                              <div
                                onClick={() => toggleZone(zone.id)}
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors select-none"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-0.5 rounded text-slate-400">
                                    {isZoneExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                  </div>
                                  <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    {zone.name}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    ({zone.districtsCount} Districts • {zone.coordinatorsCount} Coordinators)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {zone.zonalLeader ? (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEntity({
                                          type: "ZONE_LEADER",
                                          data: zone.zonalLeader,
                                          zoneName: zone.name,
                                          stateName: state.name,
                                        });
                                      }}
                                      className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 flex items-center gap-1 text-[11px] font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                                    >
                                      <UserCheck className="h-3 w-3" />
                                      <span>Zonal Leader: {zone.zonalLeader.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                      <ShieldAlert className="h-3 w-3" />
                                      Vacant
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* DISTRICTS UNDER ZONE */}
                              {isZoneExpanded && (
                                <div className="p-3 pl-6 space-y-2 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                                  {zone.districts.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic py-1 pl-2">No districts in this zone yet.</div>
                                  ) : (
                                    zone.districts.map((district: any) => {
                                      const isDistExpanded = Boolean(expandedDistricts[district.id]);

                                      return (
                                        <div
                                          key={district.id}
                                          className="rounded-lg border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 overflow-hidden"
                                        >
                                          {/* DISTRICT HEADER */}
                                          <div
                                            onClick={() => toggleDistrict(district.id)}
                                            className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 select-none"
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="p-0.5 text-slate-400">
                                                {isDistExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                              </div>
                                              <Building2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {district.name}
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                              {district.coordinatorsCount} {district.coordinatorsCount === 1 ? "Coordinator" : "Coordinators"}
                                            </span>
                                          </div>

                                          {/* COORDINATORS UNDER DISTRICT */}
                                          {isDistExpanded && (
                                            <div className="px-4 py-2 bg-slate-50/40 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 animate-fadeIn">
                                              {district.coordinators.length === 0 ? (
                                                <div className="text-[11px] text-slate-400 italic py-1">No coordinators assigned to this district.</div>
                                              ) : (
                                                district.coordinators.map((c: any) => (
                                                  <div
                                                    key={c.id}
                                                    onClick={() => setSelectedEntity({
                                                      type: "COORDINATOR",
                                                      data: c,
                                                      stateName: state.name,
                                                      zoneName: zone.name,
                                                      districtName: district.name,
                                                      parentZonalLeader: c.parentZonalLeader || zone.zonalLeader,
                                                    })}
                                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between hover:border-blue-500/40 cursor-pointer transition-all"
                                                  >
                                                    <div className="flex items-center gap-2.5">
                                                      <div className="h-6 w-6 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-black">
                                                        {c.name ? c.name[0].toUpperCase() : "C"}
                                                      </div>
                                                      <div>
                                                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                          {c.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold block">
                                                          @{c.username} {c.phoneNumber ? `• ${c.phoneNumber}` : ""}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      {c.isActive ? (
                                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                                          <CheckCircle2 className="h-3 w-3" />
                                                          Active
                                                        </span>
                                                      ) : (
                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1">
                                                          <XCircle className="h-3 w-3" />
                                                          Inactive
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Entity Details Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            {selectedEntity ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      {selectedEntity.type.replace("_", " ")}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedEntity.data.name || selectedEntity.data.username}
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold block">
                      @{selectedEntity.data.username}
                    </span>
                  </div>
                  <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700">
                    {formatRoleBadge(selectedEntity.data.role)}
                  </span>
                </div>

                {/* Details List */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold">State:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEntity.stateName}</span>
                  </div>

                  {selectedEntity.zoneName && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">Zone:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEntity.zoneName}</span>
                    </div>
                  )}

                  {selectedEntity.districtName && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">District:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEntity.districtName}</span>
                    </div>
                  )}

                  {selectedEntity.type === "COORDINATOR" && selectedEntity.parentZonalLeader && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                        Parent Zonal Leader
                      </span>
                      <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block mt-0.5">
                        {selectedEntity.parentZonalLeader.name} (@{selectedEntity.parentZonalLeader.username})
                      </span>
                    </div>
                  )}

                  {selectedEntity.data.phoneNumber && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">Phone:</span>
                      <a href={`tel:${selectedEntity.data.phoneNumber}`} className="font-bold text-blue-600 dark:text-blue-400">
                        {selectedEntity.data.phoneNumber}
                      </a>
                    </div>
                  )}

                  {selectedEntity.data.email && (
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">Email:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-40">
                        {selectedEntity.data.email}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold">Account Status:</span>
                    {selectedEntity.data.isActive ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider text-[10px]">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-500 font-black uppercase tracking-wider text-[10px]">
                        Deactivated
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                    Administrative Actions
                  </span>
                  {onEditUser && (
                    <button
                      onClick={() => onEditUser(selectedEntity.data)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Details & Assignment
                    </button>
                  )}
                  {onResetPassword && (
                    <button
                      onClick={() => onResetPassword(selectedEntity.data)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset Password
                    </button>
                  )}
                  {onToggleStatus && selectedEntity.data.role !== "ADMIN" && (
                    <button
                      onClick={() => onToggleStatus(selectedEntity.data)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-colors cursor-pointer text-xs font-bold ${
                        selectedEntity.data.isActive
                          ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                          : "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {selectedEntity.data.isActive ? "Deactivate User" : "Reactivate User"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select a Leader or Coordinator
                </h4>
                <p className="text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
                  Click on any State Leader, Zonal Leader, or Coordinator in the tree to inspect their assignments, team, and manage their account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
