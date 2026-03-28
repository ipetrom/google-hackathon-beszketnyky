"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Photo, DamageReportData, RoomAssessment } from "@/types/apartment";

interface InspectionTabProps {
  apartmentId: string;
}

function calculateSummaryFromReport(rooms: RoomAssessment[]): {
  total_items: number;
  ok_items: number;
  damaged_items: number;
  missing_items: number;
  total_estimated_cost_pln: number;
} {
  let total_items = 0;
  let ok_items = 0;
  let damaged_items = 0;
  let missing_items = 0;
  let total_estimated_cost_pln = 0;

  for (const room of rooms) {
    for (const item of room.assessments) {
      total_items++;
      if (item.current_status === "ok") ok_items++;
      else if (item.current_status === "damaged") damaged_items++;
      else if (item.current_status === "missing") missing_items++;
      total_estimated_cost_pln += item.estimated_cost_pln;
    }
  }

  return { total_items, ok_items, damaged_items, missing_items, total_estimated_cost_pln };
}

function ReadOnlyStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ok: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    damaged: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    missing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || styles.ok}`}>
      {status}
    </span>
  );
}

function ReadOnlyActionBadge({ action }: { action: string | null }) {
  if (!action) return <span className="text-gray-400 dark:text-gray-600">--</span>;
  const styles: Record<string, string> = {
    repair: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    replace: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[action] || ""}`}>
      {action}
    </span>
  );
}

function SavedReportView({ report, apartmentId }: { report: DamageReportData; apartmentId: string }) {
  const summary = report.summary || calculateSummaryFromReport(report.rooms);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Damage Report</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{report.apartment_address}</p>
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Move-out: {report.moveout_date}</span>
          <span>Inspection: {report.inspection_date}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border-l-4 border-gray-300 bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-[#1a1a1a]">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{summary.total_items}</p>
        </div>
        <div className="rounded-lg border-l-4 border-green-300 bg-white p-3 shadow-sm dark:border-green-700 dark:bg-[#1a1a1a]">
          <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">OK</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-400">{summary.ok_items}</p>
        </div>
        <div className="rounded-lg border-l-4 border-orange-300 bg-white p-3 shadow-sm dark:border-orange-700 dark:bg-[#1a1a1a]">
          <p className="text-xs font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">Damaged</p>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{summary.damaged_items}</p>
        </div>
        <div className="rounded-lg border-l-4 border-red-300 bg-white p-3 shadow-sm dark:border-red-700 dark:bg-[#1a1a1a]">
          <p className="text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400">Missing</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-400">{summary.missing_items}</p>
        </div>
      </div>

      {/* Total cost */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#1a1a1a]">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Estimated Cost</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary.total_estimated_cost_pln.toLocaleString()} PLN</span>
        </div>
      </div>

      {/* Per-room tables */}
      {report.rooms.map((room) => (
        <div key={room.room} className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{room.room}</h4>
            {room.room_notes && (
              <p className="mt-0.5 text-xs italic text-gray-500 dark:text-gray-400">{room.room_notes}</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-[#141414] dark:text-gray-400">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Original Condition</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Damage</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2 text-right">Cost (PLN)</th>
                </tr>
              </thead>
              <tbody>
                {room.assessments.map((item, idx) => (
                  <tr
                    key={item.item_name}
                    className={`border-b border-gray-50 dark:border-gray-800/50 ${idx % 2 === 1 ? "bg-gray-50/50 dark:bg-[#141414]/50" : ""}`}
                  >
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{item.item_name}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{item.original_condition || "--"}</td>
                    <td className="px-4 py-2"><ReadOnlyStatusBadge status={item.current_status} /></td>
                    <td className="max-w-[200px] px-4 py-2 text-gray-600 dark:text-gray-400">{item.damage_description || "--"}</td>
                    <td className="px-4 py-2"><ReadOnlyActionBadge action={item.action} /></td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">{item.estimated_cost_pln.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Landlord notes */}
      {report.landlord_notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Landlord Notes</h4>
          <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{report.landlord_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={`/moveout/${apartmentId}`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          View Full Report
        </Link>
        <Link
          href={`/moveout/${apartmentId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Create New Report
        </Link>
      </div>
    </div>
  );
}

export default function InspectionTab({ apartmentId }: InspectionTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedReport, setSavedReport] = useState<DamageReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(true);

  const storageKey = `inspection-notes-${apartmentId}`;

  const fetchPhotos = useCallback(() => {
    setLoading(true);
    api
      .get<{ photos: Photo[] }>(`/api/apartments/${apartmentId}/photos`)
      .then((res) => {
        setPhotos(res.data.photos);
        setError(null);
      })
      .catch(() => setError("Failed to load photos"))
      .finally(() => setLoading(false));
  }, [apartmentId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    setReportLoading(true);
    api
      .get<{ report_data: DamageReportData }>(`/api/moveout/apartments/${apartmentId}/report`)
      .then((res) => {
        setSavedReport(res.data.report_data);
      })
      .catch(() => {
        // 404 or error -- no saved report
        setSavedReport(null);
      })
      .finally(() => setReportLoading(false));
  }, [apartmentId]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setNotes(saved);
  }, [storageKey]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    localStorage.setItem(storageKey, value);
  };

  const moveInPhotos = photos.filter((p) => p.photo_type === "move-in");
  const moveOutPhotos = photos.filter((p) => p.photo_type === "move-out");

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    fileArray.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await api.post(`/api/apartments/${apartmentId}/move-out-photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchPhotos();
    } catch {
      setError("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  if (loading || reportLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="h-5 w-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  // If a saved report exists, show the read-only view
  if (savedReport) {
    return <SavedReportView report={savedReport} apartmentId={apartmentId} />;
  }

  if (error && photos.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        <button onClick={fetchPhotos} className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
          Try again
        </button>
      </div>
    );
  }

  // No move-out photos yet -- show upload prompt
  if (moveOutPhotos.length === 0) {
    return (
      <div className="space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-16 transition-colors ${
            dragOver
              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
              : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-[#1a1a1a]"
          }`}
        >
          <svg
            className="mb-4 text-gray-400 dark:text-gray-600"
            width="40"
            height="40"
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
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            No move-out inspection yet
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload move-out photos to compare with move-in photos
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Move-Out Photos"}
          </button>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            JPG, JPEG, PNG -- drag and drop or click to browse
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Move-out photos exist -- show side-by-side comparison
  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Move-in column */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Move-in Photos
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
              ({moveInPhotos.length})
            </span>
          </h3>
          {moveInPhotos.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 dark:border-gray-700 dark:bg-[#1a1a1a]">
              <p className="text-sm text-gray-500 dark:text-gray-400">No move-in photos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {moveInPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                >
                  <img
                    src={photo.storage_url}
                    alt={photo.room_type || "Move-in photo"}
                    className="h-full w-full object-cover"
                  />
                  {photo.room_type && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {photo.room_type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Move-out column */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Move-out Photos
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({moveOutPhotos.length})
              </span>
            </h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "+ Add more"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {moveOutPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
              >
                <img
                  src={photo.storage_url}
                  alt={photo.room_type || "Move-out photo"}
                  className="h-full w-full object-cover"
                />
                {photo.room_type && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {photo.room_type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Damage Report */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Damage Report
        </h3>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              AI damage detection coming soon. Compare photos manually to identify issues.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Manual Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about observed damage, missing items, or agreements with tenant..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Notes are saved automatically in your browser
          </p>
        </div>
      </section>
    </div>
  );
}
