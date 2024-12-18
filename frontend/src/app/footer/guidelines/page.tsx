"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Shield, Check, AlertCircle, Clock, ArrowRight } from "lucide-react";

const guidelines = [
  {
    title: "Respect and Professionalism",
    content:
      "Treat all members of our community with respect. This includes maintaining professional communication, respecting diverse backgrounds, and fostering an inclusive environment.",
    examples: [
      "Use professional language in all communications",
      "Respond to inquiries promptly and courteously",
      "Respect cultural differences and preferences",
    ],
    icon: Shield,
    color: "from-blue-500 to-indigo-500",
    lightColor: "from-blue-50 to-indigo-50",
  },
  {
    title: "Honest Representation",
    content:
      "Provide accurate and truthful information about your services, pricing, and availability. All images and descriptions should accurately represent your offerings.",
    examples: [
      "Use current and accurate photos of your venue/services",
      "List all fees transparently",
    ],
    icon: Check,
    color: "from-emerald-500 to-green-500",
    lightColor: "from-emerald-50 to-green-50",
  },
  {
    title: "Quality Standards",
    content:
      "Maintain high standards of service quality. This includes reliable service delivery, maintaining clean and safe environments, and delivering as promised.",
    examples: [
      "Professional presentation and punctuality",
      "Following through on all agreed services",
    ],
    icon: AlertCircle,
    color: "from-rose-500 to-pink-500",
    lightColor: "from-rose-50 to-pink-50",
  },
  {
    title: "Communication Guidelines",
    content:
      "Maintain clear and timely communication with clients. Respond to inquiries and messages within 24-48 hours.",
    examples: [
      "Provide clear information about your services",
      "Keep clients updated about any changes",
    ],
    icon: Clock,
    color: "from-amber-500 to-orange-500",
    lightColor: "from-amber-50 to-orange-50",
  },
];

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-stone-200 to-white">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-400 to-black mb-6">
              Community Guidelines
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our commitment to maintaining a professional and trustworthy
              platform
            </p>
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid gap-8 md:gap-12">
            {guidelines.map((guideline, index) => {
              const Icon = guideline.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div
                      className={`bg-gradient-to-br ${guideline.lightColor} rounded-xl p-4 md:self-start`}
                    >
                      <div
                        className={`bg-gradient-to-br ${guideline.color} rounded-lg p-3`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        {guideline.title}
                      </h2>
                      <p className="text-gray-600 mb-6 text-lg">
                        {guideline.content}
                      </p>

                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-base font-medium text-gray-900 mb-4">
                          Examples:
                        </h3>
                        <ul className="space-y-3">
                          {guideline.examples.map((example, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 text-gray-600"
                            >
                              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reporting Section */}
          <div className="mt-16">
            <div className="bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Reporting Violations
                </h2>
                <p className="text-gray-600 text-lg mb-8">
                  If you encounter any violations of these guidelines, please
                  report them to our support team. We take all reports seriously
                  and will investigate thoroughly.
                </p>
                <a
                  href="/footer/contact"
                  className="inline-flex items-center bg-black text-white px-8 py-3 rounded-lg hover:from-rose-700 hover:bg-stone-500 transition-all duration-300 group"
                >
                  Contact Support
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
