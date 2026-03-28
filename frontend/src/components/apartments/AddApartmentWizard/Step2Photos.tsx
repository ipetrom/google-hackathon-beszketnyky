"use client";

import { useState, useRef } from "react";
import api from "@/lib/api";
import { InventoryItem } from "@/types/apartment";
import PhotoUpload from "@/components/common/PhotoUpload";

interface Step2PhotosProps {
  apartmentId: string;
  onComplete: (inventoryItems: InventoryItem[]) => void;
  onBack: () => void;
}

export default function Step2Photos({
  apartmentId,
  onComplete,
  onBack,
}: Step2PhotosProps) {
  const filesRef = useRef<File[]>([]);
  const roomTypesRef = useRef<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);

  const handleFilesSelected = (files: File[], roomTypes: string[]) => {
    filesRef.current = files;
    roomTypesRef.current = roomTypes;
    setFileCount(files.length);
  };

  const handleUploadAndGenerate = async () => {
    const files = filesRef.current;
    const roomTypes = roomTypesRef.current;

    if (files.length === 0) {
      setError("Please select at least one photo to upload.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Step 1: Upload photos
      setStatusText("Uploading photos...");
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      roomTypes.forEach((rt) => formData.append("room_types", rt));

      await api.post(`/api/apartments/${apartmentId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Step 2: Generate inventory
      setStatusText("AI is analyzing your photos...");
      const res = await api.post<{ inventory_items: InventoryItem[] }>(
        `/api/apartments/${apartmentId}/inventory/generate`
      );

      onComplete(res.data.inventory_items);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setIsUploading(false);
      setStatusText("");
    }
  };

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg
          className="mb-4 h-8 w-8 animate-spin text-indigo-500"
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
          {statusText}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          This may take 10-30 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Upload Photos
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload photos of each room. The AI will analyze them to generate an
          inventory report.
        </p>
      </div>

      <PhotoUpload onFilesSelected={handleFilesSelected} />

      {fileCount > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {fileCount} photo{fileCount !== 1 ? "s" : ""} selected
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50
            dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-white/5"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <button
          type="button"
          onClick={handleUploadAndGenerate}
          disabled={fileCount === 0}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors
            hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            dark:focus:ring-offset-[#0f0f0f]"
        >
          Upload &amp; Generate Inventory
        </button>
      </div>
    </div>
  );
}
