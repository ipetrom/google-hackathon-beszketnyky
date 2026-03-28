"use client";

import { useState } from "react";
import { ApartmentCreate } from "@/types/apartment";

interface Step1DetailsProps {
  onSubmit: (data: ApartmentCreate) => void;
  isLoading: boolean;
}

const SPECIFICATION_OPTIONS = [
  "Parking",
  "Balcony",
  "Elevator",
  "Furnished",
  "Pet-friendly",
];

interface FormErrors {
  address?: string;
  city?: string;
  rooms?: string;
  sqm?: string;
}

export default function Step1Details({ onSubmit, isLoading }: Step1DetailsProps) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [rooms, setRooms] = useState("");
  const [sqm, setSqm] = useState("");
  const [floor, setFloor] = useState("");
  const [specifications, setSpecifications] = useState<Record<string, boolean>>(
    {}
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const toggleSpec = (spec: string) => {
    setSpecifications((prev) => ({
      ...prev,
      [spec.toLowerCase().replace("-", "_")]: !prev[spec.toLowerCase().replace("-", "_")],
    }));
  };

  const getSpecKey = (spec: string) => spec.toLowerCase().replace("-", "_");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    const roomsNum = Number(rooms);
    if (!rooms || isNaN(roomsNum) || roomsNum < 1 || roomsNum > 10) {
      newErrors.rooms = "Rooms must be between 1 and 10";
    }

    const sqmNum = Number(sqm);
    if (!sqm || isNaN(sqmNum) || sqmNum < 10 || sqmNum > 300) {
      newErrors.sqm = "Square meters must be between 10 and 300";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: ApartmentCreate = {
      address: address.trim(),
      city: city.trim(),
      rooms: Number(rooms),
      sqm: Number(sqm),
    };

    if (floor) {
      data.floor = Number(floor);
    }

    const activeSpecs = Object.entries(specifications).filter(
      ([, v]) => v
    );
    if (activeSpecs.length > 0) {
      data.specifications = Object.fromEntries(activeSpecs);
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., ul. Marszalkowska 10"
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors
            bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${errors.address ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-500">{errors.address}</p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g., Warsaw"
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors
            bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${errors.city ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
        />
        {errors.city && (
          <p className="mt-1 text-xs text-red-500">{errors.city}</p>
        )}
      </div>

      {/* Rooms + Sqm row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of Rooms <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            placeholder="1-10"
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors
              bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.rooms ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
          />
          {errors.rooms && (
            <p className="mt-1 text-xs text-red-500">{errors.rooms}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Square Meters <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={10}
            max={300}
            value={sqm}
            onChange={(e) => setSqm(e.target.value)}
            placeholder="10-300"
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors
              bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.sqm ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
          />
          {errors.sqm && (
            <p className="mt-1 text-xs text-red-500">{errors.sqm}</p>
          )}
        </div>
      </div>

      {/* Floor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Floor
        </label>
        <input
          type="number"
          min={0}
          max={50}
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          placeholder="e.g., 3"
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors
            dark:border-gray-700 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Specifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Specifications
        </label>
        <div className="flex flex-wrap gap-3">
          {SPECIFICATION_OPTIONS.map((spec) => {
            const key = getSpecKey(spec);
            const checked = !!specifications[key];
            return (
              <label
                key={spec}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
                  ${
                    checked
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSpec(spec)}
                  className="sr-only"
                />
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    checked
                      ? "border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {checked && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1.5 5.5L3.5 7.5L8.5 2.5" />
                    </svg>
                  )}
                </span>
                {spec}
              </label>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors
            hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            dark:focus:ring-offset-[#0f0f0f]"
        >
          {isLoading ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
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
              Saving...
            </>
          ) : (
            "Save as Draft"
          )}
        </button>
      </div>
    </form>
  );
}
