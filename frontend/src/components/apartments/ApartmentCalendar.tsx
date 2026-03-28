"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { Apartment, LeasePeriod } from "@/types/apartment";

/* ── helpers ─────────────────────────────────────────────────────── */

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const COL_W = 100;
const LABEL_W = 200;
const VISIBLE_MONTHS = 9;

/* ── modal ───────────────────────────────────────────────────────── */

interface LeaseFormData {
  tenant_name: string;
  start_date: string;
  end_date: string;
  rental_type: string;
}

function LeaseModal({
  apartmentId,
  initial,
  leaseId,
  onClose,
  onSaved,
  onDelete,
}: {
  apartmentId: string;
  initial?: LeaseFormData;
  leaseId?: string;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!leaseId;
  const [form, setForm] = useState<LeaseFormData>(
    initial ?? {
      tenant_name: "",
      start_date: "",
      end_date: "",
      rental_type: "monthly",
    }
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/lease-periods/${leaseId}`, form);
      } else {
        await api.post(`/api/apartments/${apartmentId}/lease-periods`, form);
      }
      onSaved();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!leaseId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/lease-periods/${leaseId}`);
      onDelete?.();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-[#1a1a1a]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? "Edit Lease Period" : "Create Lease Period"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tenant Name
            </span>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#121212] dark:text-gray-100"
              value={form.tenant_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, tenant_name: e.target.value }))
              }
              placeholder="Tenant name"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </span>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#121212] dark:text-gray-100"
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </span>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#121212] dark:text-gray-100"
                value={form.end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rental Type
            </span>
            <select
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#121212] dark:text-gray-100"
              value={form.rental_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, rental_type: e.target.value }))
              }
            >
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
            </select>
          </label>

          <div className="flex items-center justify-between pt-2">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : isEdit ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── tooltip ─────────────────────────────────────────────────────── */

function Tooltip({
  lease,
  x,
  y,
}: {
  lease: LeasePeriod;
  x: number;
  y: number;
}) {
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-[#1a1a1a]"
      style={{ left: x + 12, top: y - 10 }}
    >
      <p className="font-semibold text-gray-900 dark:text-gray-100">
        {lease.tenant_name || "No tenant"}
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        {fmtDate(lease.start_date)} - {fmtDate(lease.end_date)}
      </p>
      {lease.rental_type && (
        <p className="text-gray-500 dark:text-gray-400">
          Type: {lease.rental_type}
        </p>
      )}
      <p className="text-gray-500 dark:text-gray-400">
        Status: {lease.status}
      </p>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────── */

export default function ApartmentCalendar() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [leases, setLeases] = useState<Record<string, LeasePeriod[]>>({});
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0); // month offset from default start

  // modal state
  const [modal, setModal] = useState<{
    apartmentId: string;
    lease?: LeasePeriod;
  } | null>(null);

  // tooltip state
  const [tooltip, setTooltip] = useState<{
    lease: LeasePeriod;
    x: number;
    y: number;
  } | null>(null);

  const today = new Date();
  const baseStart = addMonths(startOfMonth(today), -3);
  const windowStart = addMonths(baseStart, offset);
  const months: Date[] = [];
  for (let i = 0; i < VISIBLE_MONTHS; i++) {
    months.push(addMonths(windowStart, i));
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ apartments: Apartment[] }>("/api/apartments");
      const apts = res.data.apartments;
      setApartments(apts);

      const leaseMap: Record<string, LeasePeriod[]> = {};
      await Promise.all(
        apts.map(async (a) => {
          try {
            const lr = await api.get<{ lease_periods: LeasePeriod[] }>(
              `/api/apartments/${a.id}/lease-periods`
            );
            leaseMap[a.id] = lr.data.lease_periods ?? lr.data as unknown as LeasePeriod[];
          } catch {
            leaseMap[a.id] = [];
          }
        })
      );
      setLeases(leaseMap);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Compute bar position for a lease within the visible window */
  function barStyle(lease: LeasePeriod) {
    const wStart = windowStart.getTime();
    const wEnd = addMonths(windowStart, VISIBLE_MONTHS).getTime();
    const lStart = new Date(lease.start_date).getTime();
    const lEnd = new Date(lease.end_date).getTime();

    if (lEnd < wStart || lStart > wEnd) return null;

    const totalPx = VISIBLE_MONTHS * COL_W;
    const totalMs = wEnd - wStart;

    const clampedStart = Math.max(lStart, wStart);
    const clampedEnd = Math.min(lEnd, wEnd);

    const left = ((clampedStart - wStart) / totalMs) * totalPx;
    const width = Math.max(((clampedEnd - clampedStart) / totalMs) * totalPx, 4);

    return { left, width };
  }

  function barColor(lease: LeasePeriod) {
    const now = new Date();
    const end = new Date(lease.end_date);
    const start = new Date(lease.start_date);
    if (lease.status === "completed" || end < now) return "bg-gray-400 dark:bg-gray-500";
    if (start <= now && end >= now) return "bg-green-500 animate-pulse";
    return "bg-green-500";
  }

  function aptLabel(a: Apartment): string {
    let label = a.address;
    if (a.building) label += ` ${a.building}`;
    if (a.apartment_number) label += ` / ${a.apartment_number}`;
    return label;
  }

  function handleRowClick(e: React.MouseEvent, apt: Apartment) {
    // only if clicking empty space (not a bar)
    if ((e.target as HTMLElement).dataset.leaseBar) return;
    setModal({ apartmentId: apt.id });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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

  if (apartments.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-20 dark:border-gray-700 dark:bg-[#1a1a1a]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No apartments yet. Add your first property to see the calendar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1a1a1a]">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <button
            onClick={() => setOffset((o) => o - 3)}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Previous months"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {fmtMonth(months[0])} - {fmtMonth(months[months.length - 1])}
          </span>
          <button
            onClick={() => setOffset((o) => o + 3)}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Next months"
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Header row */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <div
            className="shrink-0 border-r border-gray-200 px-3 py-2 dark:border-gray-700"
            style={{ width: LABEL_W }}
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Apartment
            </span>
          </div>
          <div className="flex overflow-x-auto">
            {months.map((m, i) => {
              const isCurrentMonth =
                m.getMonth() === today.getMonth() &&
                m.getFullYear() === today.getFullYear();
              return (
                <div
                  key={i}
                  className={`shrink-0 border-r border-gray-100 px-2 py-2 text-center dark:border-gray-800 ${
                    isCurrentMonth
                      ? "bg-indigo-50 dark:bg-indigo-950/30"
                      : ""
                  }`}
                  style={{ width: COL_W }}
                >
                  <span
                    className={`font-mono text-xs ${
                      isCurrentMonth
                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {fmtMonth(m)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows */}
        {apartments.map((apt) => (
          <div
            key={apt.id}
            className="group flex border-b border-gray-100 last:border-b-0 dark:border-gray-800"
          >
            {/* Label */}
            <div
              className="flex shrink-0 items-center border-r border-gray-200 px-3 py-3 dark:border-gray-700"
              style={{ width: LABEL_W }}
            >
              <span
                className="truncate text-sm text-gray-900 dark:text-gray-100"
                title={aptLabel(apt)}
              >
                {aptLabel(apt)}
              </span>
            </div>

            {/* Timeline area */}
            <div
              className="relative cursor-pointer"
              style={{
                width: VISIBLE_MONTHS * COL_W,
                minHeight: 44,
              }}
              onClick={(e) => handleRowClick(e, apt)}
            >
              {/* month grid lines */}
              {months.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-gray-800"
                  style={{ left: i * COL_W, width: COL_W }}
                />
              ))}

              {/* lease bars */}
              {(leases[apt.id] ?? []).map((lease) => {
                const style = barStyle(lease);
                if (!style) return null;
                return (
                  <div
                    key={lease.id}
                    data-lease-bar="true"
                    className={`absolute top-2 h-6 cursor-pointer rounded ${barColor(
                      lease
                    )} opacity-80 transition-opacity hover:opacity-100`}
                    style={{
                      left: style.left,
                      width: style.width,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ apartmentId: apt.id, lease });
                    }}
                    onMouseEnter={(e) =>
                      setTooltip({
                        lease,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseMove={(e) =>
                      setTooltip({
                        lease,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <span className="block truncate px-1.5 text-[10px] font-medium leading-6 text-white">
                      {lease.tenant_name || ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <Tooltip lease={tooltip.lease} x={tooltip.x} y={tooltip.y} />
      )}

      {/* Modal */}
      {modal && (
        <LeaseModal
          apartmentId={modal.apartmentId}
          leaseId={modal.lease?.id}
          initial={
            modal.lease
              ? {
                  tenant_name: modal.lease.tenant_name ?? "",
                  start_date: modal.lease.start_date,
                  end_date: modal.lease.end_date,
                  rental_type: modal.lease.rental_type ?? "monthly",
                }
              : undefined
          }
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchData();
          }}
          onDelete={() => {
            setModal(null);
            fetchData();
          }}
        />
      )}
    </>
  );
}
