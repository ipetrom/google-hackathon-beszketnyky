"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Apartment } from "@/types/apartment";
import ApartmentCard from "@/components/apartments/ApartmentCard";
import MonthlyCalendar from "@/components/apartments/MonthlyCalendar";
import PropertyDetailDrawer from "@/components/apartments/PropertyDetailDrawer";

type ViewMode = "grid" | "calendar";
type StatusFilter = "all" | "vacant" | "listed" | "rented" | "move-out";
type SortKey = "address" | "status" | "rooms_asc" | "rooms_desc" | "updated";

const filterLabels: Record<StatusFilter, string> = {
  all: "All",
  vacant: "Vacant",
  listed: "Listed",
  rented: "Rented",
  "move-out": "Move-Out",
};

const filterColors: Record<StatusFilter, string> = {
  all: "bg-stone-800 text-white",
  vacant: "bg-amber-100 text-amber-800",
  listed: "bg-teal-100 text-teal-800",
  rented: "bg-orange-100 text-orange-800",
  "move-out": "bg-red-100 text-red-800",
};

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("apartments-view") as ViewMode) || "grid";
    }
    return "grid";
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("address");
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("apartments-view", view);
    }
  }, [view]);

  useEffect(() => {
    api
      .get<{ apartments: Apartment[] }>("/api/apartments")
      .then((res) => setApartments(res.data.apartments))
      .catch(() => setApartments([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── KPI computations ─────────────────────────────────────────── */
  const total = apartments.length;
  const rented = apartments.filter((a) => a.status === "rented").length;
  const vacant = apartments.filter((a) => a.status === "vacant").length;
  const listed = apartments.filter((a) => a.status === "listed").length;
  const occupancyPct = total > 0 ? Math.round((rented / total) * 100) : 0;

  /* ── Filtered + sorted apartments ────────────────────────────── */
  const filtered = apartments
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .sort((a, b) => {
      switch (sortKey) {
        case "address":
          return a.address.localeCompare(b.address);
        case "status":
          return a.status.localeCompare(b.status);
        case "rooms_asc":
          return a.rooms - b.rooms;
        case "rooms_desc":
          return b.rooms - a.rooms;
        case "updated":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        default:
          return 0;
      }
    });

  const kpiTiles = [
    {
      label: "Total Properties",
      value: total,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      bg: "bg-[#faf8f5]",
      text: "text-stone-900",
      sub: "text-stone-500",
      iconColor: "text-[#c9614a]",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyPct}%`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      bg: "bg-orange-50",
      text: "text-orange-900",
      sub: "text-orange-500",
      iconColor: "text-orange-500",
    },
    {
      label: "Vacant",
      value: vacant,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
      bg: "bg-amber-50",
      text: "text-amber-900",
      sub: "text-amber-600",
      iconColor: "text-amber-500",
    },
    {
      label: "Active Listings",
      value: listed,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      bg: "bg-teal-50",
      text: "text-teal-900",
      sub: "text-teal-600",
      iconColor: "text-teal-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-gray-100">
            My Properties
          </h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-gray-400">
            Manage your entire rental portfolio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-[#faf8f5] p-0.5 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "grid"
                  ? "bg-white text-stone-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  : "text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Cards
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "calendar"
                  ? "bg-white text-stone-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  : "text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Calendar
            </button>
          </div>

          <Link
            href="/apartments/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#c9614a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b55540]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Property
          </Link>
        </div>
      </div>

      {/* KPI Hero bar */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpiTiles.map((tile) => (
            <div
              key={tile.label}
              className={`flex items-center gap-3 rounded-2xl border border-[#e8e2d9] ${tile.bg} p-4 dark:border-gray-700 dark:bg-[#1a1a1a]`}
            >
              <div className={`shrink-0 ${tile.iconColor}`}>{tile.icon}</div>
              <div>
                <p className={`text-2xl font-bold ${tile.text} dark:text-gray-100`}>
                  {tile.value}
                </p>
                <p className={`text-xs ${tile.sub} dark:text-gray-400`}>
                  {tile.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="h-7 w-7 animate-spin text-[#c9614a]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : view === "calendar" ? (
        <MonthlyCalendar />
      ) : apartments.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e2d9] bg-[#faf8f5] py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0ebe3]">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="20" width="48" height="38" rx="2" fill="#c9614a" opacity="0.3" />
              <polygon points="4,22 32,4 60,22" fill="#a0492e" opacity="0.3" />
              <rect x="24" y="44" width="16" height="14" rx="1" fill="#c9614a" opacity="0.4" />
            </svg>
          </div>
          <p className="text-base font-semibold text-stone-900 dark:text-gray-100">
            No properties yet
          </p>
          <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
            Add your first property to get started.
          </p>
          <Link
            href="/apartments/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#c9614a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b55540]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Property
          </Link>
        </div>
      ) : (
        <>
          {/* Filter + sort toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(filterLabels) as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    statusFilter === f
                      ? filterColors[f]
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {filterLabels[f]}
                  {f !== "all" && (
                    <span className="ml-1.5 opacity-70">
                      {apartments.filter((a) => a.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:border-stone-300 focus:outline-none dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300"
            >
              <option value="address">Sort: Address A–Z</option>
              <option value="status">Sort: Status</option>
              <option value="rooms_asc">Sort: Rooms ↑</option>
              <option value="rooms_desc">Sort: Rooms ↓</option>
              <option value="updated">Sort: Last Updated</option>
            </select>
          </div>

          {/* Results count */}
          {statusFilter !== "all" && (
            <p className="text-xs text-stone-400">
              {filtered.length} {filtered.length === 1 ? "property" : "properties"} found
            </p>
          )}

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#e8e2d9] bg-[#faf8f5] py-16">
              <p className="text-sm text-stone-500">
                No {filterLabels[statusFilter].toLowerCase()} properties.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  onCardClick={setSelectedApartment}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selectedApartment && (
        <PropertyDetailDrawer
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
    </div>
  );
}
