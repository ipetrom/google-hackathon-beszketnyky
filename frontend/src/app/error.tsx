'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
