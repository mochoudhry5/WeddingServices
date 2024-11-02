"use client";

import React from "react";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Website Name */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-semibold text-black">
              Dream Venues
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-100 hover:text-black rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
