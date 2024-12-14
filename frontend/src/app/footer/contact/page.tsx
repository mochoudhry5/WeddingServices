"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Input } from "@/components/ui/input";
import { Mail, Clock, ArrowRight } from "lucide-react";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-rose-50 to-white py-16 lg:py-24">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-3xl mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-purple-600 mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600">
              Questions, feedback, or just want to say hello? We'd love to hear
              from you.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow duration-300">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
                        First Name
                      </label>
                      <Input
                        type="text"
                        required
                        className="rounded-lg focus:ring-rose-500"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
                        Last Name
                      </label>
                      <Input
                        type="text"
                        required
                        className="rounded-lg focus:ring-rose-500"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Email
                    </label>
                    <Input
                      type="email"
                      required
                      className="rounded-lg focus:ring-rose-500"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Subject
                    </label>
                    <Input
                      type="text"
                      required
                      className="rounded-lg focus:ring-rose-500"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none p-3 transition-shadow duration-200"
                      required
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-600 to-rose-500 text-white py-3 px-4 rounded-lg hover:from-rose-700 hover:to-rose-600 transition-all duration-300 font-medium flex items-center justify-center group"
                  >
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-rose-50 to-purple-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start space-x-4">
                    <div className="bg-white rounded-lg p-3">
                      <Mail className="h-6 w-6 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Email Us
                      </h3>
                      <p className="text-gray-600">support@anyweds.com</p>
                      <p className="text-sm text-gray-500 mt-1">
                        We're here to help with any questions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-purple-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start space-x-4">
                    <div className="bg-white rounded-lg p-3">
                      <Clock className="h-6 w-6 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Response Time
                      </h3>
                      <p className="text-gray-600">Within 24 hours</p>
                      <p className="text-sm text-gray-500 mt-1">
                        We strive to respond as quickly as possible
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-rose-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Hours</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: 10:00am - 1:00 PM </p>
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
