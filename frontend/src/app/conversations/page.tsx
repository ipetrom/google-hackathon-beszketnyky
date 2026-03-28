"use client";

import { useState } from "react";
import ConversationList from "@/components/chat/ConversationList";
import ChatThread from "@/components/chat/ChatThread";
import { Conversation } from "@/types/apartment";

export default function ConversationsPage() {
  const [active, setActive] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        Conversations
      </h1>

      <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1a1a1a]">
        {/* Left panel - conversation list */}
        <div className="w-80 shrink-0 border-r border-gray-200 dark:border-gray-700">
          <ConversationList
            key={refreshKey}
            onSelect={(conv) => setActive(conv)}
            activeId={active?.id}
          />
        </div>

        {/* Right panel - chat thread or placeholder */}
        <div className="flex-1">
          {active ? (
            <ChatThread
              key={active.id}
              conversationId={active.id}
              conversationStatus={active.status}
              onStatusChange={() => {
                setActive((prev) =>
                  prev ? { ...prev, status: "resolved" } : null
                );
                setRefreshKey((k) => k + 1);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
