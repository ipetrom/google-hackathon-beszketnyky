"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { MoveoutApartment } from "@/types/apartment";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MoveOutPage() {
  const [apartments, setApartments] = useState<MoveoutApartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ apartments: MoveoutApartment[] }>("/api/moveout/apartments")
      .then((res) => setApartments(res.data.apartments))
      .catch(() => setError("Failed to load apartments. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-gray-100">
          Move-Out Reports
        </h1>
        <p className="mt-0.5 text-sm text-stone-500 dark:text-gray-400">
          Inspect apartments and generate damage reports before tenant move-out
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <svg
            className="h-7 w-7 animate-spin text-[#c9614a]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 text-center dark:border-red-800/40 dark:bg-red-900/10">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-3 text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && apartments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e2d9] bg-[#faf8f5] py-24 text-center dark:border-gray-700 dark:bg-[#1a1a1a]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0ebe3] dark:bg-gray-800">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-400 dark:text-gray-500"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <p className="text-base font-semibold text-stone-900 dark:text-gray-100">
            No apartments available for move-out inspection
          </p>
          <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
            Apartments with upcoming move-outs will appear here.
          </p>
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && apartments.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt) => (
            <div
              key={apt.id}
              className="group relative overflow-hidden rounded-2xl border border-[#e8e2d9] bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700 dark:bg-[#1a1a1a]"
            >
              {/* Card top accent */}
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-400" />

              <div className="p-5">
                {/* Address + city */}
                <div className="mb-3">
                  <p className="truncate text-base font-bold leading-tight text-stone-900 dark:text-gray-100">
                    {apt.address}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500 dark:text-gray-400">
                    {apt.city}
                  </p>
                </div>

                {/* Stats row */}
                <div className="mb-4 flex items-center gap-3 text-xs text-stone-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {apt.rooms} {apt.rooms === 1 ? "room" : "rooms"}
                  </span>
                  <span className="text-stone-300 dark:text-gray-600">
                    &middot;
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                    {apt.sqm} m&sup2;
                  </span>
                </div>

                {/* Badges */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {/* Inventory count badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    {apt.inventory_count} items to inspect
                  </span>

                  {/* Move-out date badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Move-out: {formatDate(apt.moveout_date)}
                  </span>
                </div>

                {/* Start Inspection button */}
                <Link
                  href={`/moveout/${apt.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Start Inspection
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
