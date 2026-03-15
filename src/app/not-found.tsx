"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050a18] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-teal-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-400 to-teal-500 text-[#050a18] font-semibold rounded-xl hover:from-teal-300 hover:to-teal-400 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-gray-300 font-medium rounded-xl hover:border-teal-400 hover:text-teal-400 transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
