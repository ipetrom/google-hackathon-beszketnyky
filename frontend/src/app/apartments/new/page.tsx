"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ApartmentCreate, Apartment, InventoryItem, PhotoNote } from "@/types/apartment";
import Step1Details from "@/components/apartments/AddApartmentWizard/Step1Details";
import Step2Photos from "@/components/apartments/AddApartmentWizard/Step2Photos";
import Step3Inventory from "@/components/apartments/AddApartmentWizard/Step3Inventory";

const STEPS = ["Details", "Photos", "Inventory"];

export default function NewApartmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apartmentId, setApartmentId] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [photoNotes, setPhotoNotes] = useState<PhotoNote[]>([]);

  const handleStep1Submit = async (data: ApartmentCreate) => {
    setIsLoading(true);
    try {
      const res = await api.post<Apartment>("/api/apartments", data);
      setApartmentId(res.data.id);
      setCurrentStep(1);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Complete = (items: InventoryItem[], notes: PhotoNote[]) => {
    setInventoryItems(items);
    setPhotoNotes(notes);
    setCurrentStep(2);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/apartments"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
          Back to Apartments
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Add New Apartment
        </h1>
      </div>

      {/* Progress indicator */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isFuture = index > currentStep;

            return (
              <li
                key={step}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? "flex-1" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : isCompleted
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-gray-900 dark:text-gray-100"
                        : isFuture
                        ? "text-gray-400 dark:text-gray-600"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-px flex-1 ${
                      isCompleted
                        ? "bg-indigo-300 dark:bg-indigo-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1a1a1a]">
        {currentStep === 0 && (
          <Step1Details onSubmit={handleStep1Submit} isLoading={isLoading} />
        )}
        {currentStep === 1 && apartmentId && (
          <Step2Photos
            apartmentId={apartmentId}
            onComplete={handleStep2Complete}
            onBack={() => setCurrentStep(0)}
          />
        )}
        {currentStep === 2 && apartmentId && (
          <Step3Inventory
            apartmentId={apartmentId}
            initialItems={inventoryItems}
            initialPhotoNotes={photoNotes}
          />
        )}
      </div>
    </div>
  );
}
