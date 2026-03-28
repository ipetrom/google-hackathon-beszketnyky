"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Apartment, Photo, LeasePeriod } from "@/types/apartment";

const statusColors: Record<string, string> = {
  vacant: "bg-amber-100 text-amber-800",
  listed: "bg-teal-100 text-teal-800",
  rented: "bg-orange-100 text-orange-800",
  "move-out": "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  vacant: "Vacant",
  listed: "Listed",
  rented: "Rented",
  "move-out": "Move-Out Pending",
};

const specLabels: Record<string, string> = {
  parking: "Parking",
  balcony: "Balcony",
  elevator: "Elevator",
  furnished: "Furnished",
  pet_friendly: "Pet-Friendly",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  apartment: Apartment;
  onClose: () => void;
}

export default function PropertyDetailDrawer({ apartment, onClose }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [leases, setLeases] = useState<LeasePeriod[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ photos: Photo[] }>(`/api/apartments/${apartment.id}/photos`)
      .then((r) => setPhotos(r.data.photos ?? []))
      .catch(() => setPhotos([]));

    api
      .get<{ lease_periods: LeasePeriod[] }>(
        `/api/apartments/${apartment.id}/lease-periods`
      )
      .then((r) => setLeases(r.data.lease_periods ?? []))
      .catch(() => setLeases([]));
  }, [apartment.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const activeLease = leases.find((l) => l.status === "active");
  const specs = apartment.specifications ?? {};

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#faf8f5] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-stone-200 bg-[#faf8f5] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight text-stone-900">
              {apartment.address}
              {apartment.building ? ` ${apartment.building}` : ""}
              {apartment.apartment_number
                ? ` / ${apartment.apartment_number}`
                : ""}
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">{apartment.city}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[apartment.status] ?? "bg-stone-100 text-stone-700"
              }`}
            >
              {statusLabels[apartment.status] ?? apartment.status}
            </span>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-200"
              aria-label="Close drawer"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Photos strip */}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-1">
            {photos.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-stone-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.storage_url}
                  alt="apartment photo"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="flex-1 space-y-5 px-5 py-4">
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-900">
                {apartment.rooms}
              </p>
              <p className="text-xs text-amber-700">Rooms</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-900">
                {apartment.sqm}
              </p>
              <p className="text-xs text-amber-700">m²</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-900">
                {apartment.floor ?? "—"}
              </p>
              <p className="text-xs text-amber-700">Floor</p>
            </div>
          </div>

          {/* Specifications */}
          {Object.values(specs).some(Boolean) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Specifications
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(specs).map(([key, val]) =>
                  val ? (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {specLabels[key] ?? key}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Active lease */}
          {activeLease ? (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
                Active Lease
              </p>
              <p className="font-semibold text-stone-900">
                {activeLease.tenant_name || "Unknown Tenant"}
              </p>
              <p className="mt-0.5 text-sm text-stone-600">
                {fmtDate(activeLease.start_date)} →{" "}
                {fmtDate(activeLease.end_date)}
              </p>
              {activeLease.rental_type && (
                <p className="mt-1 text-xs capitalize text-stone-500">
                  {activeLease.rental_type} rental
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <p className="text-sm text-stone-400">No active lease</p>
            </div>
          )}

          {/* Past leases */}
          {leases.filter((l) => l.status !== "active").length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Past Leases
              </p>
              <div className="space-y-2">
                {leases
                  .filter((l) => l.status !== "active")
                  .slice(0, 3)
                  .map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm text-stone-700">
                        {l.tenant_name || "—"}
                      </span>
                      <span className="text-xs text-stone-400">
                        {fmtDate(l.start_date)} – {fmtDate(l.end_date)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-stone-200 bg-[#faf8f5] p-4">
          <Link
            href={`/apartments/${apartment.id}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
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
            className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Listing
          </Link>
          <Link
            href={`/apartments/${apartment.id}`}
            className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-[#c9614a] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b55540]"
          >
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Open AI Chatbot
          </Link>
          <Link
            href={`/apartments/${apartment.id}`}
            className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Apartment
          </Link>
        </div>
      </div>
    </div>
  );
}
