"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserCheck, UserPlus, Search, Phone, FileText, Check, ChevronDown, X, Sparkles } from "lucide-react";

export interface PersonValue {
  personId?: string | null;
  name: string;
  phoneNumber?: string | null;
  notes?: string | null;
}

interface PersonSearchSelectProps {
  value: PersonValue;
  onChange: (value: PersonValue) => void;
  error?: string;
  disabled?: boolean;
}

export function PersonSearchSelect({
  value,
  onChange,
  error,
  disabled = false,
}: PersonSearchSelectProps) {
  const [query, setQuery] = useState(value.name || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external name changes
  useEffect(() => {
    setQuery(value.name || "");
  }, [value.name]);

  // Debounced search for existing persons
  useEffect(() => {
    if (!dropdownOpen || !query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/persons?search=${encodeURIComponent(query.trim())}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.persons || []);
        }
      } catch (err) {
        console.error("Person search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, dropdownOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectExisting = (person: any) => {
    onChange({
      personId: person.id,
      name: person.name,
      phoneNumber: person.phoneNumber || value.phoneNumber || "",
      notes: person.notes || value.notes || "",
    });
    setQuery(person.name);
    setDropdownOpen(false);
  };

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setQuery(newName);
    onChange({
      ...value,
      personId: null, // Reset ID since user changed the name manually
      name: newName,
    });
    setDropdownOpen(true);
  };

  const handleClearSelection = () => {
    onChange({
      personId: null,
      name: "",
      phoneNumber: "",
      notes: "",
    });
    setQuery("");
  };

  const isExistingLinked = Boolean(value.personId);

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            Meeting Arranged By / Referred By *
          </label>
          <span className="text-[11px] text-foreground/60 font-medium">
            Person who coordinated or referred this meeting (different from Client / Convener).
          </span>
        </div>

        {isExistingLinked ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
            <UserCheck className="h-3 w-3" />
            Existing Person Profile Linked
          </span>
        ) : query.trim() ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
            <UserPlus className="h-3 w-3" />
            New Person (Will be registered)
          </span>
        ) : null}
      </div>

      {/* Person Name Input & Autocomplete */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-[11px] font-bold text-foreground/70 mb-1">
          Person Name *
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            disabled={disabled}
            value={query}
            onChange={handleNameInputChange}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Type person name (e.g. Teja, Suresh)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-border/60 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
          />
          {query && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}

        {/* Suggestions Dropdown */}
        {dropdownOpen && query.trim().length >= 2 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-fadeIn">
            {loading ? (
              <div className="p-3 text-center text-xs text-foreground/50 font-medium">
                Searching registered persons...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="divide-y divide-border/30">
                <div className="px-3 py-1.5 bg-accent/40 text-[10px] font-black uppercase text-foreground/50">
                  Matching Registered Persons
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectExisting(p)}
                    className="w-full p-2.5 px-3 flex items-center justify-between hover:bg-primary/10 text-left transition-colors cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground group-hover:text-primary">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-foreground/40">
                          ID: {p.id.slice(0, 8)}...
                        </span>
                      </div>
                      {p.phoneNumber && (
                        <div className="flex items-center gap-1 text-[11px] text-foreground/60 font-mono">
                          <Phone className="h-3 w-3" />
                          <span>{p.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                        {p.totalMeetings} meetings
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-foreground/60 space-y-1">
                <p>No existing person found matching "{query}".</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  A new profile for "{query}" will automatically be created.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phone Number & Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-foreground/70 mb-1">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
            <input
              type="tel"
              disabled={disabled}
              value={value.phoneNumber || ""}
              onChange={(e) => onChange({ ...value, phoneNumber: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-foreground/70 mb-1">
            Additional Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
            <input
              type="text"
              disabled={disabled}
              value={value.notes || ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              placeholder="e.g. Senior Pastor contact, Regional coordinator"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

