"use client";

import React from "react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Heart, CheckCircle2, Users, Lightbulb } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-rose-50 to-white py-24">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="max-w-7xl mx-auto px-4 text-center relative animate-fadeIn">
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-purple-600 mb-6">
              About AnyWeds
            </h1>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
              Transforming how couples discover and connect with their perfect
              wedding services
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Our Mission
            </h2>
            <p className="text-xl leading-relaxed text-gray-600 text-center">
              We believe every love story deserves its perfect setting. Our
              platform seamlessly connects couples with exceptional venues and
              services, making wedding planning an enjoyable journey rather than
              a stressful task.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <Heart className="w-12 h-12 text-rose-500 mb-6" />
                <h3 className="text-xl font-semibold mb-4">
                  Curated Excellence
                </h3>
                <p className="text-gray-600">
                  Carefully vetted venues and vendors meeting our high standards
                  of quality and service
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <CheckCircle2 className="w-12 h-12 text-rose-500 mb-6" />
                <h3 className="text-xl font-semibold mb-4">
                  Transparency First
                </h3>
                <p className="text-gray-600">
                  Clear pricing, authentic reviews, and direct communication
                  with service providers
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <Users className="w-12 h-12 text-rose-500 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Community Driven</h3>
                <p className="text-gray-600">
                  Built on real experiences and feedback from couples and
                  vendors alike
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <Lightbulb className="w-12 h-12 text-rose-500 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Innovation Focus</h3>
                <p className="text-gray-600">
                  Continuously evolving our platform with cutting-edge features
                  and improvements
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What We Offer
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to create your perfect wedding day
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-rose-50 to-purple-50 p-8 rounded-2xl transform transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  For Couples
                </h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Extensive venue and vendor directory</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Completely Free</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>View pricing immediately for service</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Get in touch with vendor with one click</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-purple-50 p-8 rounded-2xl transform transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  For Vendors
                </h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Reach more potential customers</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Keep using your exisiting systems</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Only $15 a month </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <span>Fully Customizable Listing Page</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
