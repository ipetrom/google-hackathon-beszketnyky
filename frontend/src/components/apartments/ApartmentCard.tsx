"use client";

import Link from "next/link";
import { Apartment } from "@/types/apartment";
import StatusBadge from "@/components/common/StatusBadge";

interface ApartmentCardProps {
  apartment: Apartment;
}

export default function ApartmentCard({ apartment }: ApartmentCardProps) {
  return (
    <Link
      href={`/apartments/${apartment.id}`}
      className="group block rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-[#1a1a1a]"
    >
      {/* Thumbnail placeholder */}
      <div className="flex h-40 items-center justify-center rounded-t-lg bg-gray-100 dark:bg-gray-800">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 dark:text-gray-600"
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
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {apartment.address}
              {apartment.building ? ` ${apartment.building}` : ""}
              {apartment.apartment_number
                ? ` / ${apartment.apartment_number}`
                : ""}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {apartment.city}
            </p>
          </div>
          <StatusBadge status={apartment.status} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {apartment.rooms} {apartment.rooms === 1 ? "room" : "rooms"} &middot;{" "}
          {apartment.sqm} sqm
        </p>
      </div>
    </Link>
  );
}
