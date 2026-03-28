"use client";

import { useState, useCallback, useEffect } from "react";
import { Photo } from "@/types/apartment";

const FILTER_TABS = [
  "All",
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Other",
];

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeFilter === "All"
      ? photos
      : photos.filter((p) => p.room_type === activeFilter);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex > 0 ? lightboxIndex - 1 : filtered.length - 1
    );
  }, [lightboxIndex, filtered.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex < filtered.length - 1 ? lightboxIndex + 1 : 0
    );
  }, [lightboxIndex, filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, goPrev, goNext]);

  if (photos.length === 0) {
    return (
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No photos uploaded yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === tab
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => openLightbox(index)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.storage_url}
              alt={photo.room_type || "Apartment photo"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {photo.room_type && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {photo.room_type}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No photos in this category
        </p>
      )}

      {/* Lightbox modal */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
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

          {/* Prev arrow */}
          {filtered.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Previous photo"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filtered[lightboxIndex].storage_url}
              alt={filtered[lightboxIndex].room_type || "Apartment photo"}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>

          {/* Next arrow */}
          {filtered.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Next photo"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
