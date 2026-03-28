"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { InventoryItem } from "@/types/apartment";

interface Step3InventoryProps {
  apartmentId: string;
  initialItems: InventoryItem[];
}

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Other"];

export default function Step3Inventory({
  apartmentId,
  initialItems,
}: Step3InventoryProps) {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemType, setNewItemType] = useState("");
  const [newRoomType, setNewRoomType] = useState("Other");
  const [newCondition, setNewCondition] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const addItem = () => {
    if (!newItemType.trim()) return;
    const newItem: InventoryItem = {
      id: `temp-${Date.now()}`,
      apartment_id: apartmentId,
      room_type: newRoomType,
      item_type: newItemType.trim(),
      condition_notes: newCondition.trim() || null,
      photo_id: null,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemType("");
    setNewRoomType("Other");
    setNewCondition("");
    setShowAddForm(false);
  };

  const regenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await api.post<{ inventory_items: InventoryItem[] }>(
        `/api/apartments/${apartmentId}/inventory/generate`
      );
      setItems(res.data.inventory_items);
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

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Item type - editable */}
                    <div className="min-w-0 flex-1">
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
                        <button
                          type="button"
                          onClick={() => startEdit(globalIndex)}
                          className="text-left text-sm font-medium text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400 transition-colors"
                        >
                          {item.item_type}
                        </button>
                      )}
                      {item.condition_notes && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Item */}
      {showAddForm ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Item type (e.g., Sofa, Coffee table)"
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
              }}
              autoFocus
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
            />
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
            <textarea
              placeholder="Condition notes (optional)"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-100 dark:placeholder-gray-500"
            />
            <div className="flex gap-2">
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
                onClick={() => {
                  setShowAddForm(false);
                  setNewItemType("");
                  setNewRoomType("Other");
                  setNewCondition("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50
                  dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
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
