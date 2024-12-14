"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import {
  Mail,
  Shield,
  Lock,
  Globe,
  Bell,
  Trash2,
  Key,
  Server,
  Users,
  FileText,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

interface ContentSection {
  subtitle?: string;
  points: string[];
}

interface PolicySection {
  title: string;
  icon?: LucideIcon;
  content: ContentSection[];
}

const privacyPolicy: PolicySection[] = [
  {
    title: "1. Information We Collect",
    icon: Shield,
    content: [
      {
        subtitle: "Personal Information",
        points: [
          "Email Address: To communicate with you and provide account-related notifications",
          "Location Information: To display relevant vendors and services tailored to your area",
        ],
      },
      {
        subtitle: "Automatically Collected Information",
        points: [
          "Device information (e.g., browser type, operating system)",
          "IP address and usage data (e.g., pages visited, time spent on the platform)",
        ],
      },
      {
        subtitle: "Vendor-Specific Information",
        points: [
          "Subscription details, business profiles, and service descriptions",
        ],
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    icon: FileText,
    content: [
      {
        points: [
          "To connect users with wedding-related vendors",
          "To personalize your experience on the platform",
          "To communicate important updates, changes, or promotional offers",
          "To process vendor subscriptions and payments",
          "To comply with legal obligations and resolve disputes",
        ],
      },
    ],
  },
  {
    title: "3. Sharing Your Information",
    icon: Users,
    content: [
      {
        subtitle: "Third-Party Service Providers",
        points: [
          "Payment processors, email providers, and analytics services to facilitate and enhance our Services",
        ],
      },
      {
        subtitle: "Legal and Regulatory Authorities",
        points: [
          "When required by law or to protect the rights, property, or safety of AnyWeds, our users, or others",
        ],
      },
      {
        subtitle: "Business Transfers",
        points: [
          "In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of the transaction",
        ],
      },
    ],
  },
  {
    title: "4. Your Privacy Choices",
    icon: Key,
    content: [
      {
        points: [
          "Access and Update: You can access and update your personal information through your account settings",
          "Opt-Out: You may unsubscribe from promotional communications",
          "Account Deletion: Contact us to delete your account and associated data",
        ],
      },
    ],
  },
  {
    title: "5. Data Security",
    icon: Lock,
    content: [
      {
        points: [
          "We implement appropriate technical and organizational measures to protect your information",
          "Regular security assessments and updates are performed",
          "No method of transmission over the Internet is 100% secure",
        ],
      },
    ],
  },
  {
    title: "6. International Data Transfers",
    icon: Globe,
    content: [
      {
        points: [
          "Your information may be transferred to and processed in countries outside of your own",
          "We ensure that such transfers comply with applicable data protection laws",
        ],
      },
    ],
  },
  {
    title: "7. Children's Privacy",
    icon: AlertCircle,
    content: [
      {
        points: [
          "Our Services are not intended for individuals under the age of 16",
          "We do not knowingly collect personal information from children",
          "We will delete any information collected from children immediately upon discovery",
        ],
      },
    ],
  },
  {
    title: "8. Changes to This Privacy Policy",
    icon: Bell,
    content: [
      {
        points: [
          "We may update this Privacy Policy from time to time",
          "Significant changes will be communicated via email or through our platform",
          "Continued use after changes constitutes acceptance of the updated policy",
        ],
      },
    ],
  },
];
export default function PrivacyPolicyPage() {
  const lastUpdated = "December 13, 2024";

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-rose-50 to-white">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-purple-600 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
              <p className="text-lg text-gray-600 leading-relaxed">
                AnyWeds ("we," "us," or "our") is committed to protecting your
                privacy. This Privacy Policy outlines how we collect, use, and
                safeguard your personal information when you use our platform
                and services ("Services").
              </p>
            </div>

            {/* Policy Sections */}
            <div className="space-y-8">
              {privacyPolicy.map((section, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-6">
                    {section.icon && (
                      <div className="bg-rose-50 rounded-xl p-3">
                        <section.icon className="w-6 h-6 text-rose-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        {section.title}
                      </h2>
                      {section.content.map((subsection, subIndex) => (
                        <div key={subIndex} className="mb-6 last:mb-0">
                          {subsection.subtitle && (
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                              {subsection.subtitle}
                            </h3>
                          )}
                          <ul className="space-y-3">
                            {subsection.points.map((point, pointIndex) => (
                              <li
                                key={pointIndex}
                                className="flex items-start gap-3 text-gray-600"
                              >
                                <span className="text-rose-500 mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-gradient-to-br from-rose-50 to-purple-50 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about this Privacy Policy, please
                contact us:
              </p>
              <a
                href="mailto:support@anyweds.com"
                className="flex items-center gap-3 text-gray-600 hover:text-rose-600 transition-colors"
              >
                <Mail className="w-5 h-5" />
                support@anyweds.com
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
