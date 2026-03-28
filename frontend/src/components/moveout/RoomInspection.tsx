"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RoomItems, RoomAssessment, ValidationResult as ValidationResultType, DamageAssessmentItem } from "@/types/apartment";
import api from "@/lib/api";
import ValidationResult from "./ValidationResult";
import DamageAssessment from "./DamageAssessment";

type InspectionState = "UPLOAD" | "VALIDATING" | "VALIDATION_RESULT" | "ASSESSING" | "ASSESSED";

interface RoomInspectionProps {
  apartmentId: string;
  room: RoomItems;
  onComplete: (assessment: RoomAssessment) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function RoomInspection({ apartmentId, room, onComplete }: RoomInspectionProps) {
  const [state, setState] = useState<InspectionState>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation results
  const [validationResult, setValidationResult] = useState<ValidationResultType | null>(null);
  const [photoStorageUrl, setPhotoStorageUrl] = useState<string | null>(null);

  // Assessment results
  const [assessments, setAssessments] = useState<DamageAssessmentItem[]>([]);
  const [roomNotes, setRoomNotes] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const roomLabel = room.room_name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Please upload a JPG or PNG image.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("File exceeds 10MB limit.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleValidate = async () => {
    if (!file) return;
    setState("VALIDATING");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post<ValidationResultType>(
        `/api/moveout/apartments/${apartmentId}/rooms/${room.room_name}/validate`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setValidationResult(res.data);
      setPhotoStorageUrl(res.data.photo_storage_url || null);
      setPhotoUrl(res.data.photo_url || null);
      setState("VALIDATION_RESULT");
    } catch {
      setError("Validation failed. Please try again.");
      setState("UPLOAD");
    }
  };

  // Auto-advance when all items detected
  useEffect(() => {
    if (state !== "VALIDATION_RESULT" || !validationResult) return;
    if (validationResult.missing_items.length > 0) return;

    const timer = setTimeout(() => {
      handleAssess();
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, validationResult]);

  const handleAssess = async () => {
    setState("ASSESSING");
    setError(null);

    try {
      const res = await api.post<{
        room: string;
        assessments: DamageAssessmentItem[];
        room_notes: string | null;
      }>(
        `/api/moveout/apartments/${apartmentId}/rooms/${room.room_name}/assess`,
        { photo_storage_url: photoStorageUrl }
      );

      setAssessments(res.data.assessments);
      setRoomNotes(res.data.room_notes);
      setState("ASSESSED");
    } catch {
      setError("Assessment failed. Please try again.");
      setState("VALIDATION_RESULT");
    }
  };

  const handleReupload = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setValidationResult(null);
    setState("UPLOAD");
  };

  const handleMarkMissing = () => {
    handleAssess();
  };

  const handleComplete = () => {
    onComplete({
      room: room.room_name,
      assessments,
      room_notes: roomNotes,
      move_out_photo_url: photoUrl || photoStorageUrl || null,
    });
  };

  // -- RENDER --

  // Spinner helper
  const Spinner = ({ message }: { message: string }) => (
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
      <p className="text-sm font-medium text-stone-600 dark:text-gray-400">
        {message}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Room heading */}
      <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-gray-100">
        {roomLabel}
      </h2>

      {/* UPLOAD state */}
      {state === "UPLOAD" && (
        <div className="space-y-5">
          {/* Expected items */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-gray-500">
              Expected Items
            </p>
            <div className="flex flex-wrap gap-2">
              {room.items.map((item) => {
                const parts = [item.item_type, item.color, item.material].filter(Boolean);
                return (
                  <span
                    key={item.id}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-stone-600 dark:border-gray-700 dark:bg-[#1e1e1e] dark:text-gray-400"
                  >
                    {parts.join(" \u00B7 ")}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Upload zone */}
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
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
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
              Drag a photo of the {roomLabel.toLowerCase()} here or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JPG, JPEG, PNG - Max 10MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Room preview"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(null);
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                aria-label="Remove photo"
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
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Upload button */}
          <button
            type="button"
            disabled={!file}
            onClick={handleValidate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload &amp; Validate
          </button>
        </div>
      )}

      {/* VALIDATING state */}
      {state === "VALIDATING" && (
        <Spinner message={`AI is checking for all items in the ${roomLabel.toLowerCase()}...`} />
      )}

      {/* VALIDATION_RESULT state */}
      {state === "VALIDATION_RESULT" && validationResult && (
        <ValidationResult
          detectedItems={validationResult.detected_items}
          missingItems={validationResult.missing_items}
          notes={validationResult.notes}
          onReupload={handleReupload}
          onMarkMissing={handleMarkMissing}
          autoAdvancing={validationResult.missing_items.length === 0}
        />
      )}

      {/* ASSESSING state */}
      {state === "ASSESSING" && (
        <Spinner message="AI is assessing condition and estimating costs..." />
      )}

      {/* ASSESSED state */}
      {state === "ASSESSED" && (
        <div className="space-y-6">
          <DamageAssessment assessments={assessments} roomNotes={roomNotes} />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={handleComplete}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Continue to Next Room
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
