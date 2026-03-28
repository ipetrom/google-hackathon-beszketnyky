"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";
import {
  RoomAssessment,
  DamageAssessmentItem,
  DamageReportData,
} from "@/types/apartment";

interface DamageReportProps {
  apartmentId: string;
  apartmentAddress: string;
  roomAssessments: RoomAssessment[];
  onSaved: () => void;
}

interface EditableItem extends DamageAssessmentItem {
  _originalCost: number;
  _costOverridden: boolean;
}

interface EditableRoom {
  room: string;
  assessments: EditableItem[];
  room_notes: string | null;
  move_out_photo_url: string | null;
}

interface MoveOutPhoto {
  id: string;
  room_type: string;
  storage_url: string;
  uploaded_at: string;
}

function calculateSummary(rooms: EditableRoom[]): {
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

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ok: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    damaged:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    missing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[status] || styles.ok
      }`}
    >
      {status}
    </span>
  );
}

function ActionBadge({ action }: { action: string | null }) {
  if (!action) return <span className="text-gray-400 dark:text-gray-600">--</span>;

  const styles: Record<string, string> = {
    repair: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    replace: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[action] || ""
      }`}
    >
      {action}
    </span>
  );
}

/* ---- Photo Lightbox Modal ---- */
function PhotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Close lightbox"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
      </div>
    </div>
  );
}

export default function DamageReport({
  apartmentId,
  apartmentAddress,
  roomAssessments,
  onSaved,
}: DamageReportProps) {
  const [rooms, setRooms] = useState<EditableRoom[]>(() =>
    roomAssessments.map((r) => ({
      ...r,
      assessments: r.assessments.map((a) => ({
        ...a,
        _originalCost: a.estimated_cost_pln,
        _costOverridden: false,
      })),
    }))
  );

  const [landlordNotes, setLandlordNotes] = useState("");
  const [editingCost, setEditingCost] = useState<{
    roomIdx: number;
    itemIdx: number;
  } | null>(null);
  const [costInput, setCostInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Photos state
  const [photos, setPhotos] = useState<MoveOutPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // AI Report state
  const [markdownText, setMarkdownText] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => calculateSummary(rooms), [rooms]);

  // Fetch move-out photos on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await api.get<{ photos: MoveOutPhoto[] }>(
          `/api/moveout/apartments/${apartmentId}/photos`
        );
        setPhotos(res.data.photos);
      } catch {
        // Photos are supplementary; silently handle failure
        setPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };
    fetchPhotos();
  }, [apartmentId]);

  // Group photos by room_type
  const photosByRoom = useMemo(() => {
    const grouped: Record<string, MoveOutPhoto[]> = {};
    for (const photo of photos) {
      const key = photo.room_type || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(photo);
    }
    return grouped;
  }, [photos]);

  const updateItem = useCallback(
    (
      roomIdx: number,
      itemIdx: number,
      updates: Partial<EditableItem>
    ) => {
      setRooms((prev) => {
        const next = prev.map((r, ri) => {
          if (ri !== roomIdx) return r;
          return {
            ...r,
            assessments: r.assessments.map((a, ai) => {
              if (ai !== itemIdx) return a;
              return { ...a, ...updates };
            }),
          };
        });
        return next;
      });
    },
    []
  );

  const handleStatusChange = (
    roomIdx: number,
    itemIdx: number,
    newStatus: string
  ) => {
    const updates: Partial<EditableItem> = { current_status: newStatus };
    if (newStatus === "ok") {
      updates.estimated_cost_pln = 0;
      updates._costOverridden = true;
      updates.action = null;
      updates.damage_description = null;
    }
    updateItem(roomIdx, itemIdx, updates);
  };

  const startEditCost = (roomIdx: number, itemIdx: number) => {
    setEditingCost({ roomIdx, itemIdx });
    setCostInput(String(rooms[roomIdx].assessments[itemIdx].estimated_cost_pln));
  };

  const commitCost = () => {
    if (!editingCost) return;
    const { roomIdx, itemIdx } = editingCost;
    const value = Math.max(0, Math.round(Number(costInput) || 0));
    const original = rooms[roomIdx].assessments[itemIdx]._originalCost;
    updateItem(roomIdx, itemIdx, {
      estimated_cost_pln: value,
      _costOverridden: value !== original,
    });
    setEditingCost(null);
  };

  const handleCostKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCost();
    } else if (e.key === "Escape") {
      setEditingCost(null);
    }
  };

  const buildReportData = (): DamageReportData => ({
    apartment_id: apartmentId,
    apartment_address: apartmentAddress,
    moveout_date: "2026-03-31",
    inspection_date: new Date().toISOString().split("T")[0],
    rooms: rooms.map((r) => ({
      room: r.room,
      assessments: r.assessments.map((a) => ({
        item_name: a.item_name,
        original_condition: a.original_condition,
        current_status: a.current_status,
        damage_description: a.damage_description,
        action: a.action,
        estimated_cost_pln: a.estimated_cost_pln,
      })),
      room_notes: r.room_notes,
      move_out_photo_url: r.move_out_photo_url,
    })),
    summary: calculateSummary(rooms),
    landlord_notes: landlordNotes,
  });

  const handleFinalize = async () => {
    setSaving(true);
    setSaveError(null);

    const reportData = buildReportData();

    try {
      await api.post(`/api/moveout/apartments/${apartmentId}/report`, {
        report_data: reportData,
        notes: landlordNotes,
      });
      setSaveSuccess(true);
      setTimeout(() => onSaved(), 1500);
    } catch {
      setSaveError("Failed to save the report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError(null);

    const reportData = buildReportData();

    try {
      const res = await api.post<{ markdown: string }>(
        `/api/moveout/apartments/${apartmentId}/report/markdown`,
        { report_data: reportData }
      );
      setMarkdownText(res.data.markdown);
    } catch {
      setReportError("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!markdownText) return;
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = markdownText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const today = formatDate(new Date());

  return (
    <div className="space-y-8">
      {/* Lightbox */}
      {lightboxSrc && (
        <PhotoLightbox
          src={lightboxSrc}
          alt="Move-out photo"
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Success banner */}
      {saveSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Report saved successfully!
          </p>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Damage Report
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {apartmentAddress}
        </p>
        <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
          <span>Move-out date: 31 March 2026</span>
          <span>Inspection date: {today}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total Items"
          value={summary.total_items}
          borderColor="border-gray-300 dark:border-gray-600"
          textColor="text-gray-700 dark:text-gray-300"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <SummaryCard
          label="OK"
          value={summary.ok_items}
          borderColor="border-green-300 dark:border-green-700"
          textColor="text-green-700 dark:text-green-400"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <SummaryCard
          label="Damaged"
          value={summary.damaged_items}
          borderColor="border-orange-300 dark:border-orange-700"
          textColor="text-orange-700 dark:text-orange-400"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <SummaryCard
          label="Missing"
          value={summary.missing_items}
          borderColor="border-red-300 dark:border-red-700"
          textColor="text-red-700 dark:text-red-400"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Total cost */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1a1a1a]">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Estimated Cost
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.total_estimated_cost_pln.toLocaleString()} PLN
          </span>
        </div>
      </div>

      {/* Per-room breakdown */}
      {rooms.map((room, roomIdx) => {
        const roomPhotos = photosByRoom[room.room] || [];

        return (
          <div
            key={room.room}
            className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]"
          >
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {room.room}
              </h3>
              {room.room_notes && (
                <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
                  {room.room_notes}
                </p>
              )}
            </div>

            {/* Move-out photos row */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Move-Out Photos
              </p>
              {photosLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs text-gray-400">Loading photos...</span>
                </div>
              ) : roomPhotos.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {roomPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setLightboxSrc(photo.storage_url)}
                      className="flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      aria-label={`View photo of ${room.room}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.storage_url}
                        alt={`${room.room} move-out photo`}
                        className="h-[90px] w-[120px] rounded-lg object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-xs text-gray-400 dark:text-gray-500">
                  No photos uploaded
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-[#141414] dark:text-gray-400">
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5">Original Condition</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Damage</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5 text-right">Cost (PLN)</th>
                  </tr>
                </thead>
                <tbody>
                  {room.assessments.map((item, itemIdx) => {
                    const isEditingThisCost =
                      editingCost?.roomIdx === roomIdx &&
                      editingCost?.itemIdx === itemIdx;

                    return (
                      <tr
                        key={item.item_name}
                        className={`border-b border-gray-50 transition-colors dark:border-gray-800/50 ${
                          itemIdx % 2 === 1
                            ? "bg-gray-50/50 dark:bg-[#141414]/50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {item.original_condition || "--"}
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={item.current_status}
                            onChange={(e) =>
                              handleStatusChange(roomIdx, itemIdx, e.target.value)
                            }
                            className="cursor-pointer rounded border-0 bg-transparent p-0 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
                            aria-label={`Status for ${item.item_name}`}
                          >
                            <option value="ok">OK</option>
                            <option value="damaged">Damaged</option>
                            <option value="missing">Missing</option>
                          </select>
                          <div className="mt-0.5">
                            <StatusBadge status={item.current_status} />
                          </div>
                        </td>
                        <td className="max-w-[200px] px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {item.damage_description || "--"}
                        </td>
                        <td className="px-4 py-2.5">
                          <ActionBadge action={item.action} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isEditingThisCost ? (
                            <input
                              type="number"
                              min="0"
                              value={costInput}
                              onChange={(e) => setCostInput(e.target.value)}
                              onBlur={commitCost}
                              onKeyDown={handleCostKeyDown}
                              autoFocus
                              className="w-24 rounded border border-indigo-300 bg-white px-2 py-1 text-right text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-600 dark:bg-[#0f0f0f] dark:text-gray-100"
                              aria-label={`Edit cost for ${item.item_name}`}
                            />
                          ) : (
                            <button
                              onClick={() => startEditCost(roomIdx, itemIdx)}
                              className="group cursor-pointer text-right"
                              aria-label={`Click to edit cost for ${item.item_name}`}
                            >
                              <span className="font-medium text-gray-900 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400">
                                {item.estimated_cost_pln.toLocaleString()}
                              </span>
                              {item._costOverridden && (
                                <span className="block text-[10px] text-gray-400 line-through dark:text-gray-500">
                                  {item._originalCost.toLocaleString()}
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Landlord notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1a1a1a]">
        <label
          htmlFor="landlord-notes"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Landlord Notes
        </label>
        <textarea
          id="landlord-notes"
          value={landlordNotes}
          onChange={(e) => setLandlordNotes(e.target.value)}
          placeholder="Add your notes about this inspection..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:placeholder-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
        />
      </div>

      {/* AI Report Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1a1a1a]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            AI-Generated Report
          </h3>
          <div className="flex items-center gap-2">
            {markdownText && (
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy Report
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {reportLoading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : markdownText ? (
                "Regenerate"
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </div>

        {/* Report loading state */}
        {reportLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="mb-3 h-7 w-7 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              AI is generating your professional report...
            </p>
          </div>
        )}

        {/* Report error */}
        {reportError && !reportLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">{reportError}</p>
          </div>
        )}

        {/* Rendered markdown */}
        {markdownText && !reportLoading && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 dark:border-gray-700 dark:bg-[#141414]">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">{children}</h3>,
                p: ({ children }) => <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
                table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">{children}</table></div>,
                thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>,
                th: ({ children }) => <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">{children}</td>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-3">{children}</blockquote>,
                hr: () => <hr className="my-6 border-gray-200 dark:border-gray-700" />,
              }}
            >
              {markdownText}
            </ReactMarkdown>
          </div>
        )}

        {/* Empty state */}
        {!markdownText && !reportLoading && !reportError && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            Click &quot;Generate Report&quot; to create a professional AI-generated damage report.
          </p>
        )}
      </div>

      {/* Error */}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800">
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Inspection
        </button>
        <button
          onClick={handleFinalize}
          disabled={saving || saveSuccess}
          className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : saveSuccess ? "Saved" : "Finalize Report"}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  borderColor,
  textColor,
  icon,
}: {
  label: string;
  value: number;
  borderColor: string;
  textColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border-l-4 bg-white p-4 shadow-sm dark:bg-[#1a1a1a] ${borderColor}`}
    >
      <div className={`flex items-center gap-2 ${textColor}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
