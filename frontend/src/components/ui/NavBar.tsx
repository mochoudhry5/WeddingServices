"use client";

import React from "react";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Website Name */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-semibold text-black">
              Dream Venues
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <a
              href="/venues/create"
              className="text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors"
            >
              List Your Venue
            </a>
            <a
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-lg transition-colors"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
