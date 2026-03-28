import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/apartments"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Back to Apartments
        </Link>
      </div>
    </div>
  );
}
