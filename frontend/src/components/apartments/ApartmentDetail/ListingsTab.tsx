"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Listing } from "@/types/apartment";
import ListingGeneratorForm from "@/components/listings/ListingGeneratorForm";
import ListingCard from "@/components/listings/ListingCard";

interface ListingsTabProps {
  apartmentId: string;
}

export default function ListingsTab({ apartmentId }: ListingsTabProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  const fetchListings = async () => {
    try {
      const res = await api.get<{ listings: Listing[] }>(
        `/api/apartments/${apartmentId}/listings`
      );
      setListings(res.data.listings);
    } catch {
      // keep empty list on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentId]);

  const handleGenerated = (newListings: Listing[]) => {
    setListings((prev) => {
      // Replace listings for same platforms, append new ones
      const platformMap = new Map(prev.map((l) => [l.platform, l]));
      for (const nl of newListings) {
        platformMap.set(nl.platform, nl);
      }
      return Array.from(platformMap.values());
    });
    setShowGenerator(false);
  };

  const handleUpdate = (updated: Listing) => {
    setListings((prev) =>
      prev.map((l) =>
        l.id === updated.id || l.platform === updated.platform ? updated : l
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
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
    );
  }

  // No listings yet - show generator form directly
  if (listings.length === 0 && !showGenerator) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <div className="text-center">
            <svg
              className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No listings generated yet
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Generate AI-optimized listings for multiple rental platforms.
            </p>
          </div>
        </div>
        <ListingGeneratorForm
          apartmentId={apartmentId}
          onGenerated={handleGenerated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with generate button */}
      {!showGenerator && listings.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} generated
          </p>
          <button
            type="button"
            onClick={() => setShowGenerator(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
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
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Generate New Listings
          </button>
        </div>
      )}

      {/* Generator form */}
      {showGenerator && (
        <div className="space-y-2">
          <ListingGeneratorForm
            apartmentId={apartmentId}
            onGenerated={handleGenerated}
          />
          <button
            type="button"
            onClick={() => setShowGenerator(false)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Listing cards */}
      <div className="space-y-3">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}
