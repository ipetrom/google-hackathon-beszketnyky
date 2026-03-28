"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Listing } from "@/types/apartment";

const PLATFORM_INFO: Record<string, { label: string; icon: string }> = {
  otodom: { label: "Otodom.pl", icon: "\u{1F3E0}" },
  olx: { label: "OLX.pl", icon: "\u{1F4CB}" },
  airbnb: { label: "Airbnb", icon: "\u{1F3E1}" },
  booking: { label: "Booking.com", icon: "\u{1F3E8}" },
};

const STATUS_COLORS: Record<string, string> = {
  draft:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  generated:
    "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  copied:
    "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
};

interface ListingCardProps {
  listing: Listing;
  onUpdate: (listing: Listing) => void;
}

export default function ListingCard({ listing, onUpdate }: ListingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(listing.title);
  const [editDescription, setEditDescription] = useState(listing.description);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const platform = PLATFORM_INFO[listing.platform] ?? {
    label: listing.platform,
    icon: "\u{1F4C4}",
  };
  const statusClass =
    STATUS_COLORS[listing.status] ?? STATUS_COLORS.draft;

  const handleCopy = async () => {
    const text = `${listing.title}\n\n${listing.description}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`Copied! Paste into ${platform.label}`);
      setTimeout(() => setCopyMessage(null), 3000);
    } catch {
      setCopyMessage("Failed to copy.");
      setTimeout(() => setCopyMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch<Listing>(`/api/listings/${listing.id}`, {
        title: editTitle,
        description: editDescription,
      });
      onUpdate(res.data);
      setEditing(false);
    } catch {
      // keep editing state open on failure
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(listing.title);
    setEditDescription(listing.description);
    setEditing(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.post<{ listings: Listing[] }>(
        `/api/apartments/${listing.apartment_id}/listings/generate`,
        {
          platforms: [listing.platform],
          rental_type: listing.rental_type ?? "monthly",
          price: listing.price ?? 0,
        }
      );
      if (res.data.listings.length > 0) {
        onUpdate(res.data.listings[0]);
      }
    } catch {
      // silent fail
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm dark:border-gray-800 dark:bg-[#1a1a1a]">
      {/* Copy toast */}
      {copyMessage && (
        <div className="rounded-t-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {copyMessage}
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{platform.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {platform.label}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium leading-4 ${statusClass}`}
                >
                  {listing.status}
                </span>
              </div>
              {!editing && (
                <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {listing.title}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {/* Collapsed preview */}
        {!expanded && !editing && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {listing.description.slice(0, 150)}
            {listing.description.length > 150 ? "..." : ""}
          </p>
        )}

        {/* Expanded view */}
        {expanded && !editing && (
          <div className="mt-3 space-y-3">
            <div className="rounded-md bg-gray-50 p-3 dark:bg-[#111]">
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {listing.description}
              </p>
            </div>

            {listing.amenities && Object.keys(listing.amenities).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(listing.amenities).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {typeof value === "string" ? value : key}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-gray-800"
              >
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy to Clipboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditTitle(listing.title);
                  setEditDescription(listing.description);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-gray-800"
              >
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
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {regenerating ? (
                  <svg
                    className="h-3 w-3 animate-spin"
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
                ) : (
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
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                  </svg>
                )}
                Re-generate
              </button>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#111] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#111] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
