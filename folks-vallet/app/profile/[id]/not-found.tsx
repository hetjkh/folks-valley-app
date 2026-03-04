import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-black dark:text-white">
          Profile Not Found
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          The profile you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
