"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

interface ContentSection {
  subtitle?: string;
  points: string[];
}

interface PolicySection {
  title: string;
  content: ContentSection[];
}

const privacyPolicy: PolicySection[] = [
  {
    title: "Information We Collect",
    content: [
      {
        subtitle: "Information you provide to us:",
        points: [
          "Name and contact information",
          "Login credentials",
          "Profile information",
          "Payment information",
          "Service listings and descriptions",
          "Communications with other users",
        ],
      },
      {
        subtitle: "Information automatically collected:",
        points: [
          "Device information",
          "Log data and usage information",
          "Location information",
          "Cookies and similar technologies",
        ],
      },
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      {
        points: [
          "To provide and maintain our services",
          "To process your transactions",
          "To communicate with you about our services",
          "To improve and personalize your experience",
          "To ensure platform safety and security",
          "To comply with legal obligations",
        ],
      },
    ],
  },
  {
    title: "Information Sharing and Disclosure",
    content: [
      {
        points: [
          "With other users as necessary for service provision",
          "With service providers and business partners",
          "For legal requirements and protection",
          "In connection with a business transaction",
        ],
      },
    ],
  },
  {
    title: "Your Rights and Choices",
    content: [
      {
        points: [
          "Access and update your information",
          "Delete your account",
          "Opt-out of marketing communications",
          "Control cookie settings",
          "Data portability rights",
        ],
      },
    ],
  },
  {
    title: "Data Security",
    content: [
      {
        points: [
          "We implement appropriate technical and organizational security measures",
          "Regular security assessments and updates",
          "Employee training on data protection",
          "Incident response procedures",
        ],
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
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
                  Privacy Policy
                </h1>
                <p className="text-gray-500 mb-8">
                  Last updated: {lastUpdated}
                </p>

                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600">
                    At Dream Venues, we take your privacy seriously. This
                    Privacy Policy explains how we collect, use, and protect
                    your personal information.
                  </p>

                  <div className="space-y-12 mt-8">
                    {privacyPolicy.map((section, index) => (
                      <div key={index}>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                          {section.title}
                        </h2>
                        {section.content.map((subsection, subIndex) => (
                          <div key={subIndex} className="space-y-4">
                            {subsection.subtitle && (
                              <h3 className="text-lg font-medium text-gray-900">
                                {subsection.subtitle}
                              </h3>
                            )}
                            <ul className="space-y-2">
                              {subsection.points.map((point, pointIndex) => (
                                <li
                                  key={pointIndex}
                                  className="flex items-start text-gray-600"
                                >
                                  <span className="text-rose-500 mr-2">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Contact Us
                    </h2>
                    <p className="text-gray-600">
                      If you have any questions about this Privacy Policy,
                      please contact us:
                    </p>
                    <ul className="mt-4 space-y-2">
                      <li className="text-gray-600">
                        Email: privacy@dreamvenues.com
                      </li>
                      <li className="text-gray-600">
                        Address: 123 Privacy Street, Suite 100, New York, NY
                        10001
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
