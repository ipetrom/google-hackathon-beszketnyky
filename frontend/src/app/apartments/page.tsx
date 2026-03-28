"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Apartment } from "@/types/apartment";
import ApartmentCard from "@/components/apartments/ApartmentCard";
import ApartmentCalendar from "@/components/apartments/ApartmentCalendar";

type ViewMode = "grid" | "calendar";

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("apartments-view") as ViewMode) || "grid";
    }
    return "grid";
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Apartments
        </h1>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <button
              onClick={() => setView("grid")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "grid"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Grid
              </span>
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "calendar"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Calendar
              </span>
            </button>
          </div>

          <Link
            href="/apartments/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-[#0f0f0f]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Apartment
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg
            className="h-6 w-6 animate-spin text-indigo-500"
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
      ) : view === "calendar" ? (
        <ApartmentCalendar />
      ) : apartments.length === 0 ? (
        /* Empty state */
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-20 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <div className="text-center">
            <svg
              className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <line x1="9" y1="6" x2="9" y2="6.01" />
              <line x1="15" y1="6" x2="15" y2="6.01" />
              <line x1="9" y1="10" x2="9" y2="10.01" />
              <line x1="15" y1="10" x2="15" y2="10.01" />
              <line x1="9" y1="14" x2="9" y2="14.01" />
              <line x1="15" y1="14" x2="15" y2="14.01" />
              <path d="M9 18h6v4H9z" />
            </svg>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No apartments yet
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add your first property to get started.
            </p>
            <Link
              href="/apartments/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Apartment
            </Link>
          </div>
        </div>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apartment) => (
            <ApartmentCard key={apartment.id} apartment={apartment} />
          ))}
        </div>
      )}
    </div>
  );
}
