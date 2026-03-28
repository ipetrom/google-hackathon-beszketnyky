"use client";

import { useState } from "react";
import Link from "next/link";
import { Apartment } from "@/types/apartment";

const statusColors: Record<string, string> = {
  vacant: "bg-amber-100 text-amber-800",
  listed: "bg-teal-100 text-teal-800",
  rented: "bg-orange-100 text-orange-800",
  "move-out": "bg-red-100 text-red-800",
};

const statusDots: Record<string, string> = {
  vacant: "bg-amber-400",
  listed: "bg-teal-400",
  rented: "bg-orange-400",
  "move-out": "bg-red-400",
};

const statusLabels: Record<string, string> = {
  vacant: "Vacant",
  listed: "Listed",
  rented: "Rented",
  "move-out": "Move-Out Pending",
};

interface ApartmentCardProps {
  apartment: Apartment;
  onCardClick: (apartment: Apartment) => void;
}

export default function ApartmentCard({
  apartment,
  onCardClick,
}: ApartmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColor = statusColors[apartment.status] ?? "bg-stone-100 text-stone-700";
  const statusDot = statusDots[apartment.status] ?? "bg-stone-400";
  const statusLabel = statusLabels[apartment.status] ?? apartment.status;

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#e8e2d9] bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={() => onCardClick(apartment)}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-[#f2ece4]">
        {apartment.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apartment.thumbnail_url}
            alt={apartment.address}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {/* Warm building illustration placeholder */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 64 64"
              fill="none"
              className="opacity-30"
            >
              <rect x="8" y="20" width="48" height="38" rx="2" fill="#c9614a" />
              <polygon points="4,22 32,4 60,22" fill="#a0492e" />
              <rect x="14" y="30" width="8" height="8" rx="1" fill="white" />
              <rect x="28" y="30" width="8" height="8" rx="1" fill="white" />
              <rect x="42" y="30" width="8" height="8" rx="1" fill="white" />
              <rect x="24" y="44" width="16" height="14" rx="1" fill="white" />
            </svg>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${statusColor}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
        </div>

        {/* Actions menu button */}
        <div className="absolute right-2 top-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-stone-900"
            aria-label="Actions"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-9 z-20 min-w-[180px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  View Inventory
                </Link>
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Generate Listing
                </Link>
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Open AI Chatbot
                </Link>
                <div className="mx-3 border-t border-stone-100" />
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Apartment
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="mb-2">
          <p className="truncate text-base font-bold leading-tight text-stone-900">
            {apartment.address}
            {apartment.building ? ` ${apartment.building}` : ""}
            {apartment.apartment_number ? ` / ${apartment.apartment_number}` : ""}
          </p>
          <p className="mt-0.5 text-sm text-stone-500">{apartment.city}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {apartment.rooms} {apartment.rooms === 1 ? "room" : "rooms"}
          </span>
          <span className="text-stone-300">·</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            {apartment.sqm} m²
          </span>
          {apartment.floor !== null && (
            <>
              <span className="text-stone-300">·</span>
              <span>Floor {apartment.floor}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
