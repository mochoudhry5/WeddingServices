"use client";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              About Dream Venues
            </h1>
            <p className="text-xl text-gray-600">
              Connecting couples with their perfect wedding services
            </p>
          </div>

          <div className="prose prose-lg max-w-3xl mx-auto">
            <p>
              Dream Venues was founded with a simple mission: to make wedding
              planning easier and more enjoyable for couples. We understand that
              finding the right venue and vendors is one of the most important
              aspects of planning a wedding.
            </p>

            <h2>Our Mission</h2>
            <p>
              We strive to create meaningful connections between couples and
              wedding service providers, ensuring that every wedding is as
              unique and special as the couple themselves.
            </p>

            <h2>What We Offer</h2>
            <ul>
              <li>Carefully curated venues and service providers</li>
              <li>Transparent pricing and availability</li>
              <li>Direct communication with vendors</li>
              <li>Verified reviews from real couples</li>
            </ul>

            <h2>Our Values</h2>
            <div className="grid sm:grid-cols-2 gap-6 mt-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Quality</h3>
                <p className="text-gray-600">
                  We carefully vet all venues and service providers to ensure
                  the highest standards.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Transparency</h3>
                <p className="text-gray-600">
                  Clear pricing and honest reviews help couples make informed
                  decisions.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Support</h3>
                <p className="text-gray-600">
                  We're here to help both couples and vendors throughout their
                  journey.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">
                  Continuously improving our platform to better serve our
                  community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
