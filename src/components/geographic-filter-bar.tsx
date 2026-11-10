"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Globe, RotateCcw, Filter, ChevronDown } from "lucide-react";

export interface GeographicFilterState {
  state?: string;
  zone?: string;
  district?: string;
  part?: string;
}

interface GeographicFilterBarProps {
  onFilterChange: (filters: GeographicFilterState) => void;
  className?: string;
  showPartFilter?: boolean;
}

export function GeographicFilterBar({
  onFilterChange,
  className = "",
  showPartFilter = true,
}: GeographicFilterBarProps) {
  const [options, setOptions] = useState<{
    states: string[];
    zones: string[];
    districts: string[];
    parts: string[];
    scopedRole?: string;
    lockedState?: string | null;
    lockedZone?: string | null;
  }>({
    states: [],
    zones: [],
    districts: [],
    parts: [],
  });

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch cascading options from server
  const fetchOptions = async (stateVal?: string, zoneVal?: string, distVal?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stateVal) params.set("state", stateVal);
      if (zoneVal) params.set("zone", zoneVal);
      if (distVal) params.set("district", distVal);

      const res = await fetch(`/api/admin/geographic-options?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOptions(data);
        if (data.lockedState && !selectedState) {
          setSelectedState(data.lockedState);
        }
        if (data.lockedZone && !selectedZone) {
          setSelectedZone(data.lockedZone);
        }
      }
    } catch (err) {
      console.error("Failed to load geographic filter options", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedState(val);
    setSelectedZone("");
    setSelectedDistrict("");
    setSelectedPart("");
    fetchOptions(val || undefined, undefined, undefined);
    onFilterChange({
      state: val || undefined,
      zone: undefined,
      district: undefined,
      part: undefined,
    });
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedZone(val);
    setSelectedDistrict("");
    setSelectedPart("");
    fetchOptions(selectedState || undefined, val || undefined, undefined);
    onFilterChange({
      state: selectedState || undefined,
      zone: val || undefined,
      district: undefined,
      part: undefined,
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedPart("");
    fetchOptions(selectedState || undefined, selectedZone || undefined, val || undefined);
    onFilterChange({
      state: selectedState || undefined,
      zone: selectedZone || undefined,
      district: val || undefined,
      part: undefined,
    });
  };

  const handlePartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPart(val);
    onFilterChange({
      state: selectedState || undefined,
      zone: selectedZone || undefined,
      district: selectedDistrict || undefined,
      part: val || undefined,
    });
  };

  const handleReset = () => {
    setSelectedState(options.lockedState || "");
    setSelectedZone(options.lockedZone || "");
    setSelectedDistrict("");
    setSelectedPart("");
    fetchOptions(options.lockedState || undefined, options.lockedZone || undefined, undefined);
    onFilterChange({
      state: options.lockedState || undefined,
      zone: options.lockedZone || undefined,
      district: undefined,
      part: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    (selectedState && !options.lockedState) ||
    (selectedZone && !options.lockedZone) ||
    selectedDistrict ||
    selectedPart
  );

  return (
    <div
      className={`bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              Geographic Hierarchy
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 normal-case tracking-normal">
                (India → State → Zone → District → Part)
              </span>
            </h4>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Geographic Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. State Filter */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            1. State
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={handleStateChange}
              disabled={Boolean(options.lockedState)}
              className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-60 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
            >
              <option value="">All States (India-wide)</option>
              {options.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-600 dark:text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 2. Zone Filter */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            2. Zone
          </label>
          <div className="relative">
            <select
              value={selectedZone}
              onChange={handleZoneChange}
              disabled={Boolean(options.lockedZone)}
              className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-60 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
            >
              <option value="">All Zones {selectedState ? `in ${selectedState}` : ""}</option>
              {options.zones.map((zn) => (
                <option key={zn} value={zn}>
                  {zn} Zone
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-600 dark:text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 3. District Filter */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            3. District
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
            >
              <option value="">All Districts {selectedZone ? `in ${selectedZone} Zone` : ""}</option>
              {options.districts.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-600 dark:text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 4. Part / Unit Filter */}
        {showPartFilter && (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              4. Part / Local Unit
            </label>
            <div className="relative">
              <select
                value={selectedPart}
                onChange={handlePartChange}
                className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              >
                <option value="">All Parts {selectedDistrict ? `in ${selectedDistrict}` : ""}</option>
                {options.parts.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-600 dark:text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
