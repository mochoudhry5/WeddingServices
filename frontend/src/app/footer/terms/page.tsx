"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

const terms = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using Dream Venues, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.",
  },
  {
    title: "2. User Accounts",
    content: [
      "You must be 18 years or older to create an account",
      "You are responsible for maintaining the confidentiality of your account",
      "You agree to provide accurate and complete information",
      "You are responsible for all activities under your account",
    ],
  },
  {
    title: "3. Service Provider Terms",
    content: [
      "Accurate representation of services",
      "Timely response to inquiries and bookings",
      "Adherence to booking commitments",
      "Maintaining required licenses and permits",
      "Compliance with local laws and regulations",
    ],
  },
  {
    title: "4. Client Terms",
    content: [
      "Accurate booking information",
      "Timely payments",
      "Respect for venue rules and guidelines",
      "Compliance with cancellation policies",
      "Honest reviews and feedback",
    ],
  },
  {
    title: "5. Payments and Fees",
    content: [
      "Service providers set their own prices",
      "Platform fees are clearly disclosed",
      "Payment processing through secure methods",
      "Refund policies vary by service provider",
      "Cancellation fees may apply",
    ],
  },
  {
    title: "6. Prohibited Activities",
    content: [
      "Fraudulent or misleading behavior",
      "Harassment or abuse",
      "Violation of intellectual property rights",
      "Spam or unauthorized advertising",
      "Interference with platform operations",
    ],
  },
  {
    title: "7. Intellectual Property",
    content:
      "All content on Dream Venues, including but not limited to text, graphics, logos, and software, is the property of Dream Venues or its content suppliers and is protected by copyright and other intellectual property laws.",
  },
  {
    title: "8. Limitation of Liability",
    content:
      "Dream Venues is not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.",
  },
];

export default function TermsPage() {
  const lastUpdated = "November 9, 2024";

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Terms of Service
                </h1>
                <p className="text-gray-500 mb-8">
                  Last updated: {lastUpdated}
                </p>

                <div className="prose prose-gray max-w-none">
                  <div className="space-y-8">
                    {terms.map((section, index) => (
                      <div key={index}>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                          {section.title}
                        </h2>
                        {Array.isArray(section.content) ? (
                          <ul className="space-y-2">
                            {section.content.map((point, pointIndex) => (
                              <li
                                key={pointIndex}
                                className="flex items-start text-gray-600"
                              >
                                <span className="text-rose-500 mr-2">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600">{section.content}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Contact Us
                    </h2>
                    <p className="text-gray-600">
                      If you have any questions about these Terms of Service,
                      please contact us:
                    </p>
                    <ul className="mt-4 space-y-2">
                      <li className="text-gray-600">
                        Email: legal@dreamvenues.com
                      </li>
                      <li className="text-gray-600">
                        Address: 123 Legal Street, Suite 100, New York, NY 10001
                      </li>
                    </ul>
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
