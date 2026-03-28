"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { MoveoutApartment, RoomItems, RoomAssessment } from "@/types/apartment";
import RoomInspection from "@/components/moveout/RoomInspection";
import DamageReport from "@/components/moveout/DamageReport";

export default function InspectionWizardPage() {
  const params = useParams();
  const apartmentId = params.id as string;

  const [apartment, setApartment] = useState<MoveoutApartment | null>(null);
  const [rooms, setRooms] = useState<RoomItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [roomAssessments, setRoomAssessments] = useState<RoomAssessment[]>([]);
  const [wizardComplete, setWizardComplete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptRes, roomsRes] = await Promise.all([
          api.get<{ apartments: MoveoutApartment[] }>("/api/moveout/apartments"),
          api.get<{ rooms: RoomItems[] }>(`/api/moveout/apartments/${apartmentId}/rooms`),
        ]);

        const found = aptRes.data.apartments.find((a) => a.id === apartmentId);
        if (!found) {
          setError("Apartment not found.");
          return;
        }

        setApartment(found);
        setRooms(roomsRes.data.rooms);
      } catch {
        setError("Failed to load inspection data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apartmentId]);

  const handleRoomComplete = (assessment: RoomAssessment) => {
    setRoomAssessments((prev) => {
      const updated = [...prev];
      updated[currentRoomIndex] = assessment;
      return updated;
    });

    if (currentRoomIndex < rooms.length - 1) {
      setCurrentRoomIndex((i) => i + 1);
    } else {
      setWizardComplete(true);
    }
  };

  const handleBack = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex((i) => i - 1);
    }
  };

  const roomLabel = (name: string) =>
    name
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const totalCost = roomAssessments.reduce(
    (sum, ra) =>
      sum +
      ra.assessments.reduce((s, a) => s + (a.estimated_cost_pln || 0), 0),
    0
  );

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg
          className="h-7 w-7 animate-spin text-[#c9614a]"
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

  // Error
  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/moveout"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Move-Out
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 text-center dark:border-red-800/40 dark:bg-red-900/10">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Wizard complete
  if (wizardComplete) {
    return (
      <div className="space-y-6">
        <Link
          href="/moveout"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Move-Out
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-gray-100">
            Inspection Complete
          </h1>
          {apartment && (
            <p className="mt-0.5 text-sm text-stone-500 dark:text-gray-400">
              {apartment.address}, {apartment.city}
            </p>
          )}
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800/40 dark:bg-green-900/10">
          <div className="flex items-center gap-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600 dark:text-green-400"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="text-base font-bold text-green-800 dark:text-green-300">
                All {rooms.length} rooms inspected
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Total estimated cost: {totalCost} PLN
              </p>
            </div>
          </div>
        </div>

        {/* Per-room summary */}
        <div className="space-y-4">
          {roomAssessments.map((ra, idx) => {
            const roomCost = ra.assessments.reduce(
              (s, a) => s + (a.estimated_cost_pln || 0),
              0
            );
            const damaged = ra.assessments.filter(
              (a) =>
                a.current_status.toLowerCase() !== "ok" &&
                a.current_status.toLowerCase() !== "good" &&
                a.current_status.toLowerCase() !== "no damage"
            ).length;

            return (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#1a1a1a]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-stone-900 dark:text-gray-100">
                    {roomLabel(ra.room)}
                  </p>
                  <div className="flex items-center gap-3">
                    {damaged > 0 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        {damaged} issue{damaged !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-sm font-bold text-stone-900 dark:text-gray-100">
                      {roomCost} PLN
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Damage Report */}
        <DamageReport
          apartmentId={apartmentId}
          apartmentAddress={apartment ? `${apartment.address}, ${apartment.city}` : ""}
          roomAssessments={roomAssessments}
          onSaved={() => {
            window.location.href = "/moveout";
          }}
        />
      </div>
    );
  }

  // Active inspection
  const currentRoom = rooms[currentRoomIndex];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/moveout"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Move-Out
      </Link>

      {/* Header */}
      {apartment && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-gray-100">
            Inspection
          </h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-gray-400">
            {apartment.address}, {apartment.city}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700 dark:text-gray-300">
            Room {currentRoomIndex + 1} of {rooms.length} &mdash;{" "}
            {roomLabel(currentRoom.room_name)}
          </p>
          <p className="text-xs text-stone-400 dark:text-gray-500">
            {Math.round(((currentRoomIndex) / rooms.length) * 100)}% done
          </p>
        </div>
        <div className="flex gap-1.5">
          {rooms.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-colors ${
                idx < currentRoomIndex
                  ? "bg-green-500"
                  : idx === currentRoomIndex
                  ? "bg-indigo-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Previous room button */}
      {currentRoomIndex > 0 && (
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200"
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Previous Room
        </button>
      )}

      {/* Room inspection */}
      <RoomInspection
        key={currentRoom.room_name}
        apartmentId={apartmentId}
        room={currentRoom}
        onComplete={handleRoomComplete}
      />
    </div>
  );
}
