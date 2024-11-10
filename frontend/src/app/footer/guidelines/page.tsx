"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

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
  },
  {
    title: "Honest Representation",
    content:
      "Provide accurate and truthful information about your services, pricing, and availability. All images and descriptions should accurately represent your offerings.",
    examples: [
      "Use current and accurate photos of your venue/services",
      "List all fees transparently",
      "Keep your calendar availability up to date",
    ],
  },
  {
    title: "Quality Standards",
    content:
      "Maintain high standards of service quality. This includes reliable service delivery, maintaining clean and safe environments, and delivering as promised.",
    examples: [
      "Regular maintenance and cleaning of venues",
      "Professional presentation and punctuality",
      "Following through on all agreed services",
    ],
  },
  {
    title: "Communication Guidelines",
    content:
      "Maintain clear and timely communication with clients. Respond to inquiries and messages within 24-48 hours.",
    examples: [
      "Acknowledge all booking requests promptly",
      "Provide clear information about your services",
      "Keep clients updated about any changes",
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Community Guidelines
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Our commitment to maintaining a professional and trustworthy
                platform
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <p className="text-gray-600 mb-8">
                  These guidelines help ensure a positive experience for all
                  members of our community. Violation of these guidelines may
                  result in removal from our platform.
                </p>

                <div className="space-y-8">
                  {guidelines.map((guideline, index) => (
                    <div
                      key={index}
                      className="pb-8 border-b border-gray-200 last:border-0 last:pb-0"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {guideline.title}
                      </h2>
                      <p className="text-gray-600 mb-4">{guideline.content}</p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          Examples:
                        </h3>
                        <ul className="space-y-2">
                          {guideline.examples.map((example, i) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 flex items-start"
                            >
                              <span className="text-rose-500 mr-2">•</span>
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">
                    Reporting Violations
                  </h2>
                  <p className="text-gray-600">
                    If you encounter any violations of these guidelines, please
                    report them to our support team. We take all reports
                    seriously and will investigate thoroughly.
                  </p>
                  <div className="mt-4">
                    <a
                      href="/footer/contact"
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Contact Support →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
