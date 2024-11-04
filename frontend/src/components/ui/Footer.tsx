import React from "react";

export default function Footer() {
  return (
    <div>
      {" "}
      {/* Footer */}
      <footer className="bg-gray-100 px-4 pb-7">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-8 border-t border-gray-200">
            <div>
              <h5 className="font-semibold mb-4">About</h5>
              <ul className="space-y-2">
                <li>
                  <button className="text-gray-600 hover:text-gray-900">
                    About Us
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2">
                <li>
                  <button className="text-gray-600 hover:text-gray-900">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Vendors</h5>
              <ul className="space-y-2">
                <li>
                  <button className="text-gray-600 hover:text-gray-900">
                    List Your Venue
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <ul className="space-y-2">
                <li>
                  <button className="text-gray-600 hover:text-gray-900">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button className="text-gray-600 hover:text-gray-900">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              © 2024 Dream Venues. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
