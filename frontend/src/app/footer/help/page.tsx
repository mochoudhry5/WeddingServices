"use client";

import { useState } from "react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { HelpCircle, Settings, Compass, ArrowRight } from "lucide-react";

const faqCategories = {
  "Getting Started": [
    {
      question: "How do I create an account?",
      answer:
        "Click the 'Sign up' button in the top right corner and follow the registration process. You'll need to provide your email address and create a password.",
      icon: Compass,
    },
    {
      question: "How do I list my service?",
      answer:
        "Click on 'List Your Service' in the navigation bar, select your service type, and follow the step-by-step process to create your listing.",
      icon: HelpCircle,
    },
  ],
  "Account Management": [
    {
      question: "How do I update my profile?",
      answer:
        "Log in to your account, click on your profile picture, and select 'Settings' and then 'Account' to update your information.",
      icon: Settings,
    },
    {
      question: "How do I reset my password?",
      answer:
        "Click 'Login', then 'Forgot Password', and follow the instructions sent to your email to reset your password.",
      icon: Settings,
    },
  ],
};

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-stone-200 to-white ">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-400 to-black mb-6">
                How can we help you?
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Search our help center or browse frequently asked questions
                below
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid gap-16">
            {Object.entries(faqCategories).map(([category, questions]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="bg-gradient-to-r from-stone-500 to-stone-600 w-8 h-1 rounded-full mr-4" />
                  {category}
                </h2>
                <div className="grid gap-6">
                  {questions.map((faq, index) => {
                    const Icon = faq.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1 group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-stone-300 rounded-lg p-3 transition-colors">
                            <Icon className="w-6 h-6 text-black" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                              {faq.question}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support Section */}
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
              <p className="text-gray-600 mb-8">
                Our support team is here to assist you with any questions or
                concerns
              </p>
              <a
                href="/footer/contact"
                className="inline-flex items-center bg-gradient-to-r from-stone-400 to-stone-400 text-white px-8 py-3 rounded-lg hover:from-stone-500 hover:to-stone-500 transition-all duration-300 group"
              >
                Contact Support
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
