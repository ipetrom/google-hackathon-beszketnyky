"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Conversation } from "@/types/apartment";

interface ConversationsTabProps {
  apartmentId: string;
}

export default function ConversationsTab({ apartmentId }: ConversationsTabProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "needs_attention" | "ai_handled">("all");

  useEffect(() => {
    api
      .get<{ conversations: Conversation[] }>(`/api/apartments/${apartmentId}/conversations`)
      .then((res) => setConversations(res.data.conversations))
      .catch(() => setError("Failed to load conversations"))
      .finally(() => setLoading(false));
  }, [apartmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="h-5 w-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const filtered = conversations.filter((c) => {
    if (filter === "needs_attention") return c.status === "escalated";
    if (filter === "ai_handled") return c.status === "ai_handled";
    return true;
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const getPlatformLabel = (platform: string | null) => {
    if (!platform) return "Direct";
    const labels: Record<string, string> = {
      otodom: "Otodom",
      olx: "OLX",
      airbnb: "Airbnb",
      booking: "Booking",
    };
    return labels[platform.toLowerCase()] || platform;
  };

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-20 dark:border-gray-700 dark:bg-[#1a1a1a]">
        <div className="text-center">
          <svg
            className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No conversations yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tenant conversations for this apartment will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {[
          { key: "all" as const, label: "All" },
          { key: "needs_attention" as const, label: "Needs Attention" },
          { key: "ai_handled" as const, label: "AI Handled" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-[#1a1a1a]">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No conversations match this filter
          </div>
        ) : (
          filtered.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => router.push("/conversations")}
              className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            >
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {conversation.status === "escalated" ? (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-red-500" />
                ) : conversation.status === "ai_handled" ? (
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {conversation.tenant_name || "Anonymous Inquiry"}
                  </p>
                  <span className="ml-2 flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(conversation.updated_at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {getPlatformLabel(conversation.platform_source)}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <svg className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
