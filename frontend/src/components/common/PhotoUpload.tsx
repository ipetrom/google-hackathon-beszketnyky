"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Other"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface FileEntry {
  file: File;
  roomType: string;
  preview: string;
  error: string | null;
}

interface PhotoUploadProps {
  onFilesSelected: (files: File[], roomTypes: string[]) => void;
}

export default function PhotoUpload({ onFilesSelected }: PhotoUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync parent whenever entries change
  useEffect(() => {
    const valid = entries.filter((e) => !e.error);
    onFilesSelected(
      valid.map((e) => e.file),
      valid.map((e) => e.roomType)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      entries.forEach((e) => URL.revokeObjectURL(e.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newEntries: FileEntry[] = Array.from(files)
      .filter((f) => ACCEPTED_TYPES.includes(f.type))
      .map((file) => ({
        file,
        roomType: "Other",
        preview: URL.createObjectURL(file),
        error: file.size > MAX_FILE_SIZE ? "File exceeds 10MB limit" : null,
      }));
    setEntries((prev) => [...prev, ...newEntries]);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateRoomType = useCallback((index: number, roomType: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, roomType } : e))
    );
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
          isDragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-[#1a1a1a] dark:hover:border-gray-600"
        }`}
      >
        <svg
          className="mb-3 text-gray-400 dark:text-gray-500"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Drag photos here or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          JPG, JPEG, PNG - Max 10MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Thumbnail grid */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {entries.map((entry, index) => (
            <div
              key={`${entry.file.name}-${index}`}
              className={`group relative overflow-hidden rounded-lg border ${
                entry.error
                  ? "border-red-400 dark:border-red-600"
                  : "border-gray-200 dark:border-gray-700"
              } bg-white dark:bg-[#1a1a1a]`}
            >
              {/* Preview image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.preview}
                  alt={entry.file.name}
                  className="h-full w-full object-cover"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  aria-label={`Remove ${entry.file.name}`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="space-y-2 p-2.5">
                <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                  {entry.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatSize(entry.file.size)}
                </p>
                {entry.error && (
                  <p className="text-xs text-red-500">{entry.error}</p>
                )}
                <select
                  value={entry.roomType}
                  onChange={(e) => updateRoomType(index, e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition-colors
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
