"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import {
  Mail,
  Globe,
  Shield,
  AlertCircle,
  Lock,
  FileText,
  Users,
  Code,
  BookOpen,
  Scale,
  CreditCard,
  XOctagon,
  FlaskConical,
  Cloud,
} from "lucide-react";

const terms = [
  {
    title: "1. Eligibility and Account Creation",
    content: [
      "Users must be at least 16 years old to access our Services",
      "Vendors must be at least 18 years old to list services",
      "You must provide accurate and complete registration information",
      "You are responsible for maintaining the security of your account credentials",
      "Multiple accounts for the same business are not permitted",
      "AnyWeds reserves the right to refuse service to anyone",
    ],
    icon: Shield,
  },
  {
    title: "2. Scope of Services",
    content: [
      "AnyWeds provides a platform connecting engaged couples with wedding vendors",
      "We do not provide wedding services directly",
      "We do not guarantee vendor availability or pricing",
      "Search results are based on various factors including relevance and user feedback",
      "Featured listings may be promoted or sponsored",
      "Service availability may vary by location",
    ],
    icon: Globe,
  },
  {
    title: "3. Subscription Plans and Payments",
    content: [
      "Vendor subscriptions are billed on a recurring basis",
      "Subscription fees are non-refundable unless required by law",
      "Free trial periods convert to paid subscriptions automatically",
      "Price changes will be notified at least 30 days in advance",
      "Late payments may result in service interruption",
      "All fees are exclusive of applicable taxes",
      "Currency conversions are based on current exchange rates",
    ],
    icon: CreditCard,
  },
  {
    title: "4. User Obligations and Conduct",
    content: [
      "Users must provide accurate information in all communications",
      "No harassment, discrimination, or abusive behavior",
      "No spam, phishing, or unauthorized advertising",
      "No scraping or unauthorized data collection",
      "No impersonation of others or misrepresentation",
      "Users must respect intellectual property rights",
      "No interference with platform security measures",
    ],
    icon: Users,
  },
  {
    title: "5. Vendor Responsibilities",
    content: [
      "Must maintain current business licenses and permits",
      "Must provide accurate service descriptions and pricing",
      "Must respond to inquiries within 48 hours",
      "Must honor quoted prices and commitments",
      "Must maintain appropriate insurance coverage",
      "Must comply with local laws and regulations",
      "Must maintain accurate calendar availability",
    ],
    icon: BookOpen,
  },
  {
    title: "6. Content and Intellectual Property",
    content: [
      "Users retain ownership of their content",
      "Users grant AnyWeds a worldwide license to use uploaded content",
      "Content must not infringe on others' rights",
      "AnyWeds may remove content at its discretion",
      "The AnyWeds platform and branding are protected by copyright",
      "User feedback may be used for marketing purposes",
      "Photos must accurately represent services",
    ],
    icon: FileText,
  },
  {
    title: "7. Privacy and Data Usage",
    content: [
      "We collect and process data as described in our Privacy Policy",
      "User data may be shared with vendors for booking purposes",
      "Location data is used to provide relevant search results",
      "Marketing communications can be opted out of",
      "Data retention periods vary by type of information",
      "Users can request their data under applicable laws",
      "Third-party integrations have separate privacy policies",
    ],
    icon: Lock,
  },
  {
    title: "8. Platform Security",
    content: [
      "Users must not attempt to breach platform security",
      "Account sharing is not permitted",
      "Security incidents must be reported immediately",
      "Two-factor authentication is available for added security",
      "Regular security audits are performed",
      "Automated security monitoring is in place",
    ],
    icon: Code,
  },
  {
    title: "9. Dispute Resolution",
    content: [
      "Disputes between users and vendors should first be resolved directly",
      "AnyWeds may mediate but is not obligated to do so",
      "Arbitration is required for platform-related disputes",
      "Class action waiver applies",
      "Small claims court options are preserved",
      "Notice period of 30 days required before legal action",
      "Choice of law is [Jurisdiction]",
    ],
    icon: Scale,
  },
  {
    title: "10. Liability and Disclaimers",
    content: [
      "AnyWeds is not liable for vendor-user disputes",
      "Platform provided 'as is' without warranties",
      "Force majeure events excuse performance",
      "Damage limitations apply to all claims",
      "Users indemnify AnyWeds against third-party claims",
      "Vendor insurance does not cover AnyWeds",
    ],
    icon: AlertCircle,
  },
  {
    title: "11. Service Modifications",
    content: [
      "Features may be added or removed at any time",
      "Pricing may be modified with notice",
      "Platform maintenance may cause temporary unavailability",
      "APIs and integrations may change",
      "Legacy features may be discontinued",
    ],
    icon: FileText,
  },
  {
    title: "12. Account Termination",
    content: [
      "Users may terminate accounts at any time",
      "AnyWeds may terminate accounts for violations",
      "Content may be retained after termination",
      "Certain obligations survive termination",
      "Refunds are at AnyWeds' discretion",
    ],
    icon: XOctagon,
  },
  {
    title: "13. Beta Features",
    content: [
      "Beta features are provided 'as is'",
      "Beta features may be modified or discontinued",
      "Beta user feedback may be incorporated",
      "No compensation for beta testing",
    ],
    icon: FlaskConical,
  },
  {
    title: "14. Force Majeure",
    content: [
      "Service disruptions due to circumstances beyond our control",
      "Natural disasters and acts of God",
      "Government actions and regulations",
      "Internet service provider failures",
      "Cybersecurity incidents",
    ],
    icon: Cloud,
  },
];

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">Last updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
              <p className="text-lg text-gray-600 leading-relaxed">
                Welcome to AnyWeds! These Terms of Service govern your use of
                the AnyWeds platform, which connects users with wedding-related
                vendors worldwide. By accessing or using our Services, you agree
                to comply with these Terms.
              </p>
            </div>

            {/* Terms Sections */}
            <div className="space-y-8">
              {terms.map((section, index) => (
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
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {section.title}
                      </h2>
                      <ul className="space-y-3">
                        {section.content.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="flex items-start gap-3 text-gray-600"
                          >
                            <span className="text-rose-500 mt-1.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
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
                For questions or concerns regarding these Terms, please contact
                us:
              </p>
              <div className="space-y-4">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
