"use client";
import React from "react";
import { Facebook, Instagram, Twitter } from "lucide-react";

const footerLinks = {
  Company: [
    { name: "About Us", href: "/footer/about" },
    { name: "Terms of Service", href: "/footer/terms" },
    { name: "Privacy Policy", href: "/footer/privacy" },
  ],
  Support: [
    { name: "Contact Us", href: "/footer/contact" },
    { name: "Help Center", href: "/footer/help" },
    { name: "Community Guidelines", href: "/footer/guidelines" },
  ],
  Services: [
    { name: "List Your Service", href: "/services" },
    { name: "Search For Service", href: "/" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-100">
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col">
          {/* Main Footer Content */}
          <div className="px-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 py-8">
              {/* Logo and Social Section - Aligned with Navbar */}
              <div className="md:col-span-3">
                <a href="/" className="inline-block">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-400 to-black">
                    AnyWeds
                  </h2>
                </a>
                <div className="mt-6 flex space-x-4">
                  <a
                    href="#"
                    className="text-black transition-colors p-2 rounded-full"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="https://www.instagram.com/anyweds/" target="_blank"
                    className="text-black transition-colors p-2 rounded-full"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="#"
                    className="text-black transition-colors p-2 rounded-full"
                    aria-label="Twitter"
                  >
                    <Twitter size={20} />
                  </a>
                </div>
              </div>

              {/* Links Sections - Pushed to the right */}
              <div className="md:col-span-9 grid grid-cols-3 gap-8">
                {Object.entries(footerLinks).map(([category, links]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                      {category}
                    </h3>
                    <ul className="space-y-3">
                      {links.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="text-black hover:text-stone-400 transition-colors text-sm"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright - Reduced top padding */}
          <div className="px-4">
            <p className="text-sm text-black text-center">
              © {new Date().getFullYear()} AnyWeds. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
