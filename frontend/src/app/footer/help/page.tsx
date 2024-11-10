"use client";

import { useState } from "react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const faqCategories = {
  "Getting Started": [
    {
      question: "How do I create an account?",
      answer:
        "Click the 'Sign up' button in the top right corner and follow the registration process. You'll need to provide your email address and create a password.",
    },
    {
      question: "How do I list my service?",
      answer:
        "Click on 'List Your Service' in the navigation bar, select your service type, and follow the step-by-step process to create your listing.",
    },
  ],
  "Bookings & Payments": [
    {
      question: "How do payments work?",
      answer:
        "We use secure payment processing. When a booking is confirmed, the payment is held securely until the service is delivered.",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "Cancellation policies vary by vendor. Each listing includes specific cancellation terms set by the service provider.",
    },
  ],
  "Account Management": [
    {
      question: "How do I update my profile?",
      answer:
        "Log in to your account, click on your profile picture, and select 'Edit Profile' to update your information.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Click 'Login', then 'Forgot Password', and follow the instructions sent to your email to reset your password.",
    },
  ],
};

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                How can we help you?
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Search our help center or browse frequently asked questions
                below
              </p>

              <div className="mt-8 max-w-xl mx-auto">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <Input
                    type="text"
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-12 md:gap-16">
            {Object.entries(faqCategories).map(([category, questions]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category}
                </h2>
                <div className="grid gap-6">
                  {questions.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-xl font-semibold mb-4">Still need help?</h2>
            <a
              href="/footer/contact"
              className="inline-flex bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
