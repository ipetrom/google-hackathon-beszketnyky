"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Apartment } from "@/types/apartment";
import StatusBadge from "@/components/common/StatusBadge";
import OverviewTab from "@/components/apartments/ApartmentDetail/OverviewTab";
import ListingsTab from "@/components/apartments/ApartmentDetail/ListingsTab";
import ConversationsTab from "@/components/apartments/ApartmentDetail/ConversationsTab";
import InspectionTab from "@/components/apartments/ApartmentDetail/InspectionTab";

const TABS = ["Overview", "Listings", "Conversations", "Inspection"] as const;
type Tab = (typeof TABS)[number];

const STATUSES = [
  { value: "vacant", label: "Vacant" },
  { value: "listed", label: "Listed" },
  { value: "rented", label: "Rented" },
  { value: "move-out", label: "Move-out Pending" },
] as const;

interface EditFormData {
  address: string;
  building: string;
  apartment_number: string;
  city: string;
  rooms: number;
  sqm: number;
  floor: string;
  specifications: Record<string, boolean>;
}

const SPEC_OPTIONS = ["parking", "balcony", "elevator", "furnished", "pet_friendly"];

export default function ApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  // Status dropdown
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    address: "",
    building: "",
    apartment_number: "",
    city: "",
    rooms: 1,
    sqm: 10,
    floor: "",
    specifications: {},
  });

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<Apartment>(`/api/apartments/${id}`)
      .then((res) => setApartment(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Close status dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!apartment || newStatus === apartment.status) {
      setStatusOpen(false);
      return;
    }
    setStatusUpdating(true);
    try {
      const res = await api.patch<Apartment>(`/api/apartments/${id}`, { status: newStatus });
      setApartment(res.data);
    } catch {
      // Silently fail -- badge reverts
    } finally {
      setStatusUpdating(false);
      setStatusOpen(false);
    }
  };

  const openEditModal = () => {
    if (!apartment) return;
    setEditForm({
      address: apartment.address,
      building: apartment.building || "",
      apartment_number: apartment.apartment_number || "",
      city: apartment.city,
      rooms: apartment.rooms,
      sqm: apartment.sqm,
      floor: apartment.floor !== null ? String(apartment.floor) : "",
      specifications: apartment.specifications || {},
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError(null);
    try {
      const payload: Record<string, unknown> = {
        address: editForm.address,
        city: editForm.city,
        rooms: editForm.rooms,
        sqm: editForm.sqm,
        specifications: editForm.specifications,
      };
      if (editForm.building) payload.building = editForm.building;
      if (editForm.apartment_number) payload.apartment_number = editForm.apartment_number;
      if (editForm.floor !== "") payload.floor = Number(editForm.floor);

      const res = await api.patch<Apartment>(`/api/apartments/${id}`, payload);
      setApartment(res.data);
      setEditOpen(false);
    } catch {
      setEditError("Failed to save changes. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/apartments/${id}`);
      router.push("/apartments");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const toggleSpec = (key: string) => {
    setEditForm((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: !prev.specifications[key],
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="h-6 w-6 animate-spin text-indigo-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="space-y-4">
        <Link
          href="/apartments"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Apartments
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            Apartment not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/apartments"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Apartments
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
              {apartment.address}
              {apartment.building ? ` ${apartment.building}` : ""}
              {apartment.apartment_number ? ` / ${apartment.apartment_number}` : ""}
            </h1>

            {/* Status badge with dropdown */}
            <div ref={statusRef} className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                disabled={statusUpdating}
                className="cursor-pointer disabled:opacity-50"
              >
                <StatusBadge status={apartment.status} />
              </button>
              {statusOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#1a1a1a]">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                        apartment.status === s.value
                          ? "font-medium text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {apartment.status === s.value && (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span className={apartment.status === s.value ? "" : "ml-5"}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{apartment.city}</p>
        </div>

        <button
          onClick={openEditModal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-white/5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "Overview" && <OverviewTab apartment={apartment} />}
        {activeTab === "Listings" && <ListingsTab apartmentId={id} />}
        {activeTab === "Conversations" && <ConversationsTab apartmentId={id} />}
        {activeTab === "Inspection" && <InspectionTab apartmentId={id} />}
      </div>

      {/* Delete Apartment */}
      <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
        <button
          onClick={() => setDeleteOpen(true)}
          className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Delete Apartment
        </button>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-[#1a1a1a]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Apartment</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{editError}</p>
              </div>
            )}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Address *</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Building</label>
                  <input
                    type="text"
                    value={editForm.building}
                    onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Apt Number</label>
                  <input
                    type="text"
                    value={editForm.apartment_number}
                    onChange={(e) => setEditForm({ ...editForm, apartment_number: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">City *</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rooms *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editForm.rooms}
                    onChange={(e) => setEditForm({ ...editForm, rooms: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sqm *</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={editForm.sqm}
                    onChange={(e) => setEditForm({ ...editForm, sqm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Floor</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={editForm.floor}
                    onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Features</label>
                <div className="flex flex-wrap gap-2">
                  {SPEC_OPTIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpec(spec)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        editForm.specifications[spec]
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      {spec.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.address || !editForm.city}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-[#1a1a1a]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Apartment</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this apartment? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
