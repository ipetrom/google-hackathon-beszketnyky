"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Listing } from "@/types/apartment";

const PLATFORMS = [
  { value: "otodom", label: "Otodom.pl", icon: "\u{1F3E0}" },
  { value: "olx", label: "OLX.pl", icon: "\u{1F4CB}" },
  { value: "airbnb", label: "Airbnb", icon: "\u{1F3E1}" },
  { value: "booking", label: "Booking.com", icon: "\u{1F3E8}" },
] as const;

const RENTAL_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
] as const;

interface ListingGeneratorFormProps {
  apartmentId: string;
  onGenerated: (listings: Listing[]) => void;
}

export default function ListingGeneratorForm({
  apartmentId,
  onGenerated,
}: ListingGeneratorFormProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [rentalType, setRentalType] = useState<string>("monthly");
  const [price, setPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const validate = (): string | null => {
    if (selectedPlatforms.length === 0) {
      return "Please select at least one platform.";
    }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      return "Please enter a valid price greater than 0.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ listings: Listing[] }>(
        `/api/apartments/${apartmentId}/listings/generate`,
        {
          platforms: selectedPlatforms,
          rental_type: rentalType,
          price: parseFloat(price),
        }
      );
      onGenerated(res.data.listings);
    } catch {
      setError("Failed to generate listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-16 dark:border-gray-800 dark:bg-[#1a1a1a]">
        <svg
          className="h-8 w-8 animate-spin text-indigo-500 mb-4"
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
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          AI is generating your listings...
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          This may take 10-20 seconds.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#1a1a1a]"
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Generate Listings
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Select platforms and configure pricing to generate AI-optimized
          listings.
        </p>
      </div>

      {/* Platform selection */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Platforms
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLATFORMS.map((platform) => {
            const selected = selectedPlatforms.includes(platform.value);
            return (
              <label
                key={platform.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  selected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePlatform(platform.value)}
                  className="sr-only"
                />
                <span>{platform.icon}</span>
                <span className="font-medium">{platform.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Rental type */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rental Type
        </legend>
        <div className="flex gap-4">
          {RENTAL_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="radio"
                name="rental_type"
                value={type.value}
                checked={rentalType === type.value}
                onChange={() => setRentalType(type.value)}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
              />
              {type.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Price
        </label>
        <div className="relative w-48">
          <input
            id="price"
            type="number"
            min="1"
            step="1"
            placeholder="e.g., 3000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#111] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
            PLN
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Generate Listings
      </button>
    </form>
  );
}
