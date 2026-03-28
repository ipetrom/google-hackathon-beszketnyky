"use client";

interface ValidationResultProps {
  detectedItems: string[];
  missingItems: string[];
  notes: string;
  onReupload: () => void;
  onMarkMissing: (items: string[]) => void;
  autoAdvancing?: boolean;
}

export default function ValidationResult({
  detectedItems,
  missingItems,
  notes,
  onReupload,
  onMarkMissing,
  autoAdvancing,
}: ValidationResultProps) {
  const allDetected = missingItems.length === 0;

  return (
    <div className="space-y-5">
      {/* Banner */}
      {allDetected ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800/40 dark:bg-green-900/10">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-green-600 dark:text-green-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              All items detected!
            </p>
            {autoAdvancing && (
              <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                Auto-advancing to damage assessment...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 dark:border-orange-800/40 dark:bg-orange-900/10">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-orange-600 dark:text-orange-400"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            Some items were not detected
          </p>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2">
        {detectedItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-[#1a1a1a]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0 text-green-500"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm text-stone-700 dark:text-gray-300">
              {item}
            </span>
          </div>
        ))}
        {missingItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50/50 px-4 py-2.5 dark:border-red-800/30 dark:bg-red-900/10"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0 text-red-500"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-sm text-stone-700 dark:text-gray-300">
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {notes && (
        <p className="text-sm italic text-stone-500 dark:text-gray-400">
          {notes}
        </p>
      )}

      {/* Actions for missing items */}
      {!allDetected && (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onReupload}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#222]"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Re-upload Photo
          </button>
          <button
            type="button"
            onClick={() => onMarkMissing(missingItems)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            Mark as Missing &amp; Continue
          </button>
        </div>
      )}
    </div>
  );
}
