"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Conversation } from "@/types/apartment";

type Filter = "all" | "escalated" | "ai_handled";

function timeAgo(ts: string): string {
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function platformColor(platform: string | null): string {
  switch (platform?.toLowerCase()) {
    case "airbnb":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
    case "booking":
    case "booking.com":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "olx":
    case "olx.pl":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "otodom":
    case "otodom.pl":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

interface ConversationListProps {
  onSelect: (conversation: Conversation) => void;
  activeId?: string;
}

export default function ConversationList({
  onSelect,
  activeId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const res = await api.get<{ conversations: Conversation[] }>(
        "/api/conversations",
        { params }
      );
      setConversations(
        res.data.conversations ?? (res.data as unknown as Conversation[])
      );
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Needs Attention", value: "escalated" },
    { label: "AI Handled", value: "ai_handled" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <svg
              className="h-5 w-5 animate-spin text-indigo-500"
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
        ) : conversations.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            No conversations found.
          </p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${
                activeId === conv.id
                  ? "bg-indigo-50 dark:bg-indigo-950/30"
                  : ""
              }`}
            >
              {/* Status indicator */}
              <div className="mt-1.5 shrink-0">
                {conv.status === "escalated" ? (
                  <span className="block h-2.5 w-2.5 rounded-full bg-red-500" />
                ) : conv.status === "ai_handled" ? (
                  <svg
                    className="h-3.5 w-3.5 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="block h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {conv.tenant_name || "Anonymous"}
                  </span>
                  <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                    {timeAgo(conv.updated_at)}
                  </span>
                </div>
                {conv.platform_source && (
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${platformColor(
                      conv.platform_source
                    )}`}
                  >
                    {conv.platform_source}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
