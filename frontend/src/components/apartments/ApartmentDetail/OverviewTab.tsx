"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Apartment, Photo, InventoryItem } from "@/types/apartment";
import PhotoGallery from "@/components/common/PhotoGallery";

interface OverviewTabProps {
  apartment: Apartment;
}

export default function OverviewTab({ apartment }: OverviewTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  useEffect(() => {
    api
      .get<{ photos: Photo[] }>(`/api/apartments/${apartment.id}/photos`)
      .then((res) => setPhotos(res.data.photos))
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));

    api
      .get<{ inventory_items: InventoryItem[] }>(`/api/apartments/${apartment.id}/inventory`)
      .then((res) => setInventory(res.data.inventory_items))
      .catch(() => {})
      .finally(() => setLoadingInventory(false));
  }, [apartment.id]);

  const specEntries = apartment.specifications
    ? Object.entries(apartment.specifications).filter(([, v]) => v)
    : [];

  // Group inventory by room
  const grouped = inventory.reduce<Record<string, InventoryItem[]>>(
    (acc, item) => {
      const room = item.room_type || "Unassigned";
      if (!acc[room]) acc[room] = [];
      acc[room].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      {/* Photo Gallery */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Photo Gallery
        </h3>
        {loadingPhotos ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
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
        ) : (
          <PhotoGallery photos={photos} />
        )}
      </section>

      {/* Inventory */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Inventory
        </h3>
        {loadingInventory ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
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
        ) : inventory.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <div className="text-center">
              <svg
                className="mx-auto mb-2 text-gray-400 dark:text-gray-600"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inventory will be generated after photo upload
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([room, roomItems]) => (
              <div key={room}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {room}
                </h4>
                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-[#1a1a1a]">
                  {roomItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.item_type}
                        </p>
                        {item.condition_notes && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {item.condition_notes}
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {item.room_type || "Unassigned"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Specifications */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Specifications
          </h3>
          <button
            type="button"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Edit Details
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <dl className="divide-y divide-gray-200 dark:divide-gray-800">
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Address
              </dt>
              <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                {apartment.address}
                {apartment.building ? `, ${apartment.building}` : ""}
                {apartment.apartment_number
                  ? ` / ${apartment.apartment_number}`
                  : ""}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                City
              </dt>
              <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                {apartment.city}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Rooms
              </dt>
              <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                {apartment.rooms}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Square Meters
              </dt>
              <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                {apartment.sqm} sqm
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Floor
              </dt>
              <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">
                {apartment.floor !== null ? apartment.floor : "N/A"}
              </dd>
            </div>
            {specEntries.length > 0 && (
              <div className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Features
                </dt>
                <dd className="col-span-2 flex flex-wrap gap-2">
                  {specEntries.map(([key]) => (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    >
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}
