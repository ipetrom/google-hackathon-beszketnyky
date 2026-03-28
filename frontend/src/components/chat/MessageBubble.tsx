"use client";

import { Message } from "@/types/apartment";

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { sender, message_text, timestamp } = message;
  const isLandlord = sender === "landlord";
  const isAi = sender === "ai";

  return (
    <div
      className={`flex ${isLandlord ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isLandlord
            ? "bg-indigo-600 text-white"
            : isAi
            ? "bg-indigo-100 text-gray-900 dark:bg-indigo-900/40 dark:text-gray-100"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {/* Sender label */}
        <div className="mb-0.5 flex items-center gap-1.5">
          {isAi && <span className="text-sm">&#x1F916;</span>}
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              isLandlord
                ? "text-indigo-200"
                : isAi
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {isAi ? "AI Assistant" : sender === "tenant" ? "Tenant" : "You"}
          </span>
        </div>

        {/* Message text */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message_text}
        </p>

        {/* Timestamp */}
        <p
          className={`mt-1 text-right text-[10px] ${
            isLandlord
              ? "text-indigo-300"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
