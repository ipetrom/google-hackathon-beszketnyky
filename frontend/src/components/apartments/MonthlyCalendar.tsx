"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Apartment, LeasePeriod } from "@/types/apartment";
import PropertyDetailDrawer from "./PropertyDetailDrawer";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

interface CalendarEvent {
  type: "move-in" | "move-out" | "expiration";
  apartment: Apartment;
  lease: LeasePeriod;
}

export default function MonthlyCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [leaseMap, setLeaseMap] = useState<Record<string, LeasePeriod[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  const today = todayStr();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ apartments: Apartment[] }>("/api/apartments");
      const apts = res.data.apartments;
      setApartments(apts);

      const map: Record<string, LeasePeriod[]> = {};
      await Promise.all(
        apts.map(async (a) => {
          try {
            const lr = await api.get<{ lease_periods: LeasePeriod[] }>(
              `/api/apartments/${a.id}/lease-periods`
            );
            map[a.id] = lr.data.lease_periods ?? [];
          } catch {
            map[a.id] = [];
          }
        })
      );
      setLeaseMap(map);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  /* Build event map: date string → CalendarEvent[] */
  function buildEventMap(): Record<string, CalendarEvent[]> {
    const map: Record<string, CalendarEvent[]> = {};
    const todayDate = new Date(today);

    apartments.forEach((apt) => {
      const leases = leaseMap[apt.id] ?? [];
      leases.forEach((lease) => {
        // Move-in
        const startKey = lease.start_date.slice(0, 10);
        if (!map[startKey]) map[startKey] = [];
        map[startKey].push({ type: "move-in", apartment: apt, lease });

        // Move-out or expiration
        const endKey = lease.end_date.slice(0, 10);
        if (!map[endKey]) map[endKey] = [];
        const endDate = new Date(lease.end_date.slice(0, 10));
        const isActive = lease.status === "active" && endDate >= todayDate;
        map[endKey].push({
          type: isActive ? "expiration" : "move-out",
          apartment: apt,
          lease,
        });
      });
    });

    return map;
  }

  /* Build calendar grid */
  function buildGrid(): (number | null)[][] {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Convert to Mon-first: Mon=0 … Sun=6
    const startOffset = (firstDay + 6) % 7;

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }

  const eventMap = buildEventMap();
  const grid = buildGrid();

  const eventIcons: Record<string, { icon: string; color: string; label: string }> = {
    "move-in": { icon: "▲", color: "text-teal-700 bg-teal-50 border-teal-200", label: "Move-in" },
    "move-out": { icon: "▼", color: "text-stone-600 bg-stone-100 border-stone-200", label: "Move-out" },
    expiration: { icon: "⚑", color: "text-orange-700 bg-orange-50 border-orange-200", label: "Lease expires" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin text-[#c9614a]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {/* Calendar header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#faf8f5] px-5 py-3">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-800"
            aria-label="Previous month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-stone-900">
              {MONTH_NAMES[month]} {year}
            </h2>
            {(year !== now.getFullYear() || month !== now.getMonth()) && (
              <button
                onClick={goToToday}
                className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-800"
            aria-label="Next month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 border-b border-stone-100 bg-[#faf8f5] px-5 py-2">
          {Object.entries(eventIcons).map(([type, cfg]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                {cfg.icon}
              </span>
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-stone-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div>
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7 border-b border-stone-100 last:border-b-0">
              {row.map((day, colIdx) => {
                const dateKey = day
                  ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  : null;
                const isToday = dateKey === today;
                const events = dateKey ? (eventMap[dateKey] ?? []) : [];
                const isWeekend = colIdx >= 5;

                return (
                  <div
                    key={colIdx}
                    className={`min-h-[80px] p-1.5 ${
                      colIdx < 6 ? "border-r border-stone-100" : ""
                    } ${isWeekend && day ? "bg-stone-50/60" : ""} ${
                      !day ? "bg-stone-50/30" : ""
                    }`}
                  >
                    {day && (
                      <>
                        {/* Day number */}
                        <div className="mb-1 flex justify-end">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                              isToday
                                ? "bg-[#c9614a] text-white"
                                : "text-stone-700"
                            }`}
                          >
                            {day}
                          </span>
                        </div>

                        {/* Events */}
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((ev, i) => {
                            const cfg = eventIcons[ev.type];
                            const aptShort = ev.apartment.address.split(" ").slice(0, 2).join(" ");
                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedApartment(ev.apartment)}
                                className={`flex w-full items-center gap-1 rounded border px-1.5 py-0.5 text-left transition-opacity hover:opacity-80 ${cfg.color}`}
                                title={`${cfg.label}: ${ev.apartment.address}`}
                              >
                                <span className="shrink-0 text-[9px] font-bold">{cfg.icon}</span>
                                <span className="truncate text-[10px] font-medium leading-tight">
                                  {aptShort}
                                </span>
                              </button>
                            );
                          })}
                          {events.length > 3 && (
                            <p className="pl-1 text-[10px] text-stone-400">
                              +{events.length - 3} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedApartment && (
        <PropertyDetailDrawer
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
    </>
  );
}
