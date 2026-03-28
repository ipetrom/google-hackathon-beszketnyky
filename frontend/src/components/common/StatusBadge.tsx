"use client";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  vacant:
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  listed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  rented:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "move-out":
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] ?? statusStyles.vacant;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}
