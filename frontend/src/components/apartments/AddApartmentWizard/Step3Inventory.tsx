"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { InventoryItem, PhotoNote, Photo } from "@/types/apartment";

interface Step3InventoryProps {
  apartmentId: string;
  initialItems: InventoryItem[];
  initialPhotoNotes?: PhotoNote[];
}

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Other"];

const OBJECT_TYPES = [
  "furniture",
  "appliance",
  "fixture",
  "decor",
  "storage",
  "lighting",
  "other",
] as const;

const CONDITION_VALUES = [
  "excellent",
  "good",
  "fair",
  "poor",
  "damaged",
] as const;

const TYPE_BADGE_STYLES: Record<string, string> = {
  furniture:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  appliance:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  fixture:
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  decor:
    "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  storage:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  lighting:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  other:
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const CONDITION_BADGE_STYLES: Record<string, string> = {
  excellent:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  good:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  fair:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  poor:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  damaged:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

function formatRoomName(detected_room: string): string {
  return detected_room
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Step3Inventory({
  apartmentId,
  initialItems,
  initialPhotoNotes,
}: Step3InventoryProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [photoNotes, setPhotoNotes] = useState<PhotoNote[]>(
    initialPhotoNotes || []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [photoNotesExpanded, setPhotoNotesExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add item form state
  const [newItemType, setNewItemType] = useState("");
  const [newRoomType, setNewRoomType] = useState("Other");
  const [newObjectType, setNewObjectType] = useState<string>("furniture");
  const [newColor, setNewColor] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newCondition, setNewCondition] = useState<string>("good");
  const [newPosition, setNewPosition] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    api
      .get<{ photos: Photo[] }>(`/api/apartments/${apartmentId}/photos`)
      .then((r) => setPhotos(r.data.photos ?? []))
      .catch(() => setPhotos([]));
  }, [apartmentId]);

  // Group items by room
  const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const room = item.room_type || "Unassigned";
    if (!acc[room]) acc[room] = [];
    acc[room].push(item);
    return acc;
  }, {});

  const roomCount = Object.keys(grouped).length;
  const itemCount = items.length;

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index].item_type);
  };

  const saveEdit = (index: number) => {
    if (!editValue.trim()) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, item_type: editValue.trim() } : item
      )
    );
    setEditingIndex(null);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleNotesExpanded = (index: number) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const resetAddForm = () => {
    setNewItemType("");
    setNewRoomType("Other");
    setNewObjectType("furniture");
    setNewColor("");
    setNewMaterial("");
    setNewCondition("good");
    setNewPosition("");
    setNewNotes("");
    setShowAddForm(false);
  };

  const addItem = () => {
    if (!newItemType.trim()) return;
    const newItem: InventoryItem = {
      id: `temp-${Date.now()}`,
      apartment_id: apartmentId,
      room_type: newRoomType,
      item_type: newItemType.trim(),
      condition_notes: newNotes.trim() || null,
      photo_id: null,
      object_type: newObjectType || null,
      color: newColor.trim() || null,
      material: newMaterial.trim() || null,
      condition: newCondition || null,
      position: newPosition.trim() || null,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    resetAddForm();
  };

  const regenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await api.post<{
        inventory_items: InventoryItem[];
        photo_notes?: PhotoNote[];
      }>(`/api/apartments/${apartmentId}/inventory/generate`);
      setItems(res.data.inventory_items);
      setPhotoNotes(res.data.photo_notes || []);
    } catch {
      setError("Failed to regenerate inventory. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const confirmAndSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/api/apartments/${apartmentId}/inventory`, {
        items: items.map((item) => ({
          room_type: item.room_type,
          item_type: item.item_type,
          condition_notes: item.condition_notes,
          photo_id: item.photo_id,
          object_type: item.object_type,
          color: item.color,
          material: item.material,
          condition: item.condition,
          position: item.position,
        })),
      });
      router.push(`/apartments/${apartmentId}`);
    } catch {
      setError("Failed to save inventory. Please try again.");
      setIsSaving(false);
    }
  };

  if (isRegenerating) {
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
          AI is re-analyzing your photos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Review Inventory
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {itemCount} item{itemCount !== 1 ? "s" : ""} detected in{" "}
            {roomCount} room{roomCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={regenerate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50
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
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Re-generate
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Uploaded photos strip */}
      {photos.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Uploaded Photos ({photos.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-opacity hover:opacity-90 dark:border-gray-700 dark:bg-gray-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.storage_url}
                  alt={photo.room_type || `Photo ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {photo.room_type && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {photo.room_type}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + photos.length - 1) % photos.length); }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          <div className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex].storage_url}
              alt={photos[lightboxIndex].room_type || "Photo"}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          <p className="absolute bottom-4 text-xs text-white/60">{lightboxIndex + 1} / {photos.length}</p>
        </div>
      )}

      {/* AI Photo Notes */}
      {photoNotes.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setPhotoNotesExpanded(!photoNotesExpanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Photo Notes ({photoNotes.length} photo
              {photoNotes.length !== 1 ? "s" : ""} analyzed)
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-gray-400 transition-transform ${
                photoNotesExpanded ? "rotate-180" : ""
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {photoNotesExpanded && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <ul className="space-y-2">
                {photoNotes.map((note, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                      {formatRoomName(note.detected_room)}:
                    </span>{" "}
                    {note.notes}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Inventory grouped by room */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([room, roomItems]) => (
          <div key={room}>
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {room}
            </h3>
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-[#1a1a1a]">
              {roomItems.map((item) => {
                const globalIndex = items.indexOf(item);
                const isEditing = editingIndex === globalIndex;
                const hasSubtitle = item.color || item.material;
                const isNotesExpanded = expandedNotes.has(globalIndex);

                return (
                  <div
                    key={item.id}
                    className="px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Item info */}
                      <div className="min-w-0 flex-1">
                        {/* Name row with badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(globalIndex);
                                if (e.key === "Escape") setEditingIndex(null);
                              }}
                              onBlur={() => saveEdit(globalIndex)}
                              autoFocus
                              className="w-full rounded border border-indigo-500 bg-white px-2 py-1 text-sm text-gray-900 outline-none
                                dark:bg-[#1a1a1a] dark:text-gray-100"
                            />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(globalIndex)}
                                className="text-left text-sm font-medium text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400 transition-colors"
                              >
                                {item.item_type}
                              </button>
                              {item.object_type && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    TYPE_BADGE_STYLES[item.object_type] ||
                                    TYPE_BADGE_STYLES.other
                                  }`}
                                >
                                  {item.object_type}
                                </span>
                              )}
                              {item.condition && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    CONDITION_BADGE_STYLES[item.condition] ||
                                    CONDITION_BADGE_STYLES.fair
                                  }`}
                                >
                                  {item.condition}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Color + Material subtitle */}
                        {hasSubtitle && !isEditing && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {[item.color, item.material]
                              .filter(Boolean)
                              .join(" \u00B7 ")}
                          </p>
                        )}

                        {/* Position */}
                        {item.position && !isEditing && (
                          <p className="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500">
                            {item.position}
                          </p>
                        )}

                        {/* Expandable notes */}
                        {item.condition_notes && !isEditing && (
                          <button
                            type="button"
                            onClick={() => toggleNotesExpanded(globalIndex)}
                            className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          >
                            {isNotesExpanded ? "Hide notes" : "Show notes"}
                          </button>
                        )}
                        {isNotesExpanded && item.condition_notes && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {item.condition_notes}
                          </p>
                        )}
                      </div>

                      {/* Room badge */}
                      <span className="flex-shrink-0 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {item.room_type || "Unassigned"}
                      </span>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeItem(globalIndex)}
                        className="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        aria-label={`Remove ${item.item_type}`}
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
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Item */}
      {showAddForm ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            Add New Item
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Name - required */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Sofa, Coffee table"
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                value={newObjectType}
                onChange={(e) => setNewObjectType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors
                  focus:outline-none focus:ring-1 focus:ring-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-300"
              >
                {OBJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Room
              </label>
              <select
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors
                  focus:outline-none focus:ring-1 focus:ring-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-300"
              >
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Condition
              </label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors
                  focus:outline-none focus:ring-1 focus:ring-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-300"
              >
                {CONDITION_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <input
                type="text"
                placeholder="e.g., Dark brown"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* Material */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Material
              </label>
              <input
                type="text"
                placeholder="e.g., Leather, Wood"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* Position - full width */}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Position
              </label>
              <input
                type="text"
                placeholder="e.g., Center of room, against wall"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* Notes - full width */}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                placeholder="Condition notes (optional)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={addItem}
              disabled={!newItemType.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={resetAddForm}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50
                dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Item
        </button>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={confirmAndSave}
          disabled={isSaving}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors
            hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            dark:focus:ring-offset-[#0f0f0f]"
        >
          {isSaving ? (
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
            "Confirm and Save"
          )}
        </button>
      </div>
    </div>
  );
}
