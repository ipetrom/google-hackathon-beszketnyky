"use client";

import { DamageAssessmentItem } from "@/types/apartment";

interface DamageAssessmentProps {
  assessments: DamageAssessmentItem[];
  roomNotes: string | null;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "ok" || s === "good" || s === "no damage") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
        OK
      </span>
    );
  }
  if (s === "missing" || s === "not found") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
        Missing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
      Damaged
    </span>
  );
}

function actionBadge(action: string | null) {
  if (!action) return null;
  const a = action.toLowerCase();
  if (a === "repair") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
        Repair
      </span>
    );
  }
  if (a === "replace") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
        Replace
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-500/10 dark:text-gray-400">
      {action}
    </span>
  );
}

export default function DamageAssessment({
  assessments,
  roomNotes,
}: DamageAssessmentProps) {
  const roomTotal = assessments.reduce(
    (sum, a) => sum + (a.estimated_cost_pln || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Items */}
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-[#1a1a1a]">
        {assessments.map((item, idx) => {
          const status = item.current_status.toLowerCase();
          const hasCost = item.estimated_cost_pln > 0;
          const isDamaged =
            status === "damaged" ||
            status === "wear" ||
            (status !== "ok" &&
              status !== "good" &&
              status !== "no damage" &&
              status !== "missing" &&
              status !== "not found");
          const isMissing = status === "missing" || status === "not found";

          return (
            <div key={idx} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                {/* Left: name + condition flow */}
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-stone-900 dark:text-gray-100">
                    {item.item_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-gray-400">
                    {item.original_condition && (
                      <>
                        <span>{item.original_condition}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                    {statusBadge(item.current_status)}
                  </div>
                </div>

                {/* Right: action + cost */}
                <div className="flex items-center gap-3">
                  {(isDamaged || isMissing) && actionBadge(item.action)}
                  {hasCost && (
                    <span className="text-sm font-bold text-stone-900 dark:text-gray-100">
                      ~{item.estimated_cost_pln} PLN
                    </span>
                  )}
                </div>
              </div>

              {/* Damage description */}
              {isDamaged && item.damage_description && (
                <p className="mt-2 text-xs text-stone-500 dark:text-gray-400">
                  {item.damage_description}
                </p>
              )}

              {/* Missing description */}
              {isMissing && (
                <p className="mt-2 text-xs text-stone-500 dark:text-gray-400">
                  Not found during inspection
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Room subtotal */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-[#141414]">
        <span className="text-sm font-semibold text-stone-700 dark:text-gray-300">
          Room cost
        </span>
        <span className="text-sm font-bold text-stone-900 dark:text-gray-100">
          {roomTotal} PLN
        </span>
      </div>

      {/* Room notes */}
      {roomNotes && (
        <p className="text-sm italic text-stone-400 dark:text-gray-500">
          {roomNotes}
        </p>
      )}
    </div>
  );
}
