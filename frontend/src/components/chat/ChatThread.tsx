"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import { Message, Conversation } from "@/types/apartment";
import MessageBubble from "./MessageBubble";

interface ChatThreadProps {
  conversationId: string;
  conversationStatus?: string;
  onStatusChange?: () => void;
}

export default function ChatThread({
  conversationId,
  conversationStatus,
  onStatusChange,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ messages: Message[] }>(
        `/api/conversations/${conversationId}/messages`
      );
      setMessages(res.data.messages ?? (res.data as unknown as Message[]));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await api.post(`/api/conversations/${conversationId}/messages`, {
        sender: "landlord",
        message_text: trimmed,
      });
      setText("");

      // If escalated, mark resolved
      if (conversationStatus === "escalated") {
        try {
          await api.patch(`/api/conversations/${conversationId}/status`, {
            status: "resolved",
          });
          onStatusChange?.();
        } catch {
          /* ignore */
        }
      }

      await fetchMessages();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Escalation banner */}
      {conversationStatus === "escalated" && (
        <div className="border-b border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          This conversation needs your attention
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-[#1a1a1a]">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#121212] dark:text-gray-100 dark:placeholder:text-gray-500"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          >
            {sending ? (
              <svg
                className="h-4 w-4 animate-spin"
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
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
