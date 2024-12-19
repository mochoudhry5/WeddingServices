"use client";

import { useState } from "react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Input } from "@/components/ui/input";
import { Mail, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "support@anyweds.com",
          subject: `Contact Form: ${formData.subject}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contact Form Submission</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(to right, #78716c, #44403c); padding: 2px; border-radius: 8px;">
                    <div style="background-color: white; padding: 30px; border-radius: 6px;">
                      <!-- Header -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #44403c; font-size: 24px; margin: 0; padding-bottom: 10px; border-bottom: 2px solid #f3f4f6;">
                          New Contact Form Submission
                        </h1>
                      </div>
  
                      <!-- Content -->
                      <div style="margin-top: 20px;">
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                          <h2 style="color: #44403c; font-size: 18px; margin: 0 0 15px 0;">Contact Details</h2>
                          <p style="margin: 0 0 10px 0;">
                            <strong style="color: #44403c;">Name:</strong> 
                            <span style="color: #4b5563;">${
                              formData.firstName
                            } ${formData.lastName}</span>
                          </p>
                          <p style="margin: 0 0 10px 0;">
                            <strong style="color: #44403c;">Email:</strong> 
                            <span style="color: #4b5563;">${
                              formData.email
                            }</span>
                          </p>
                          <p style="margin: 0;">
                            <strong style="color: #44403c;">Subject:</strong> 
                            <span style="color: #4b5563;">${
                              formData.subject
                            }</span>
                          </p>
                        </div>
  
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px;">
                          <h2 style="color: #44403c; font-size: 18px; margin: 0 0 15px 0;">Message</h2>
                          <div style="color: #4b5563; white-space: pre-wrap;">${formData.message.replace(
                            /\n/g,
                            "<br>"
                          )}</div>
                        </div>
                      </div>
  
                      <!-- Footer -->
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0;">This email was sent from the AnyWeds contact form.</p>
                        <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} AnyWeds. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success(
        "Message sent successfully. We'll get back to you within 24 hours."
      );
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast.error(
        "Error sending message. Please try again or contact us directly at support@anyweds.com"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-stone-200 to-white py-16 lg:py-24">
          <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative max-w-3xl mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-400 to-black mb-4">
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
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="rounded-lg focus:ring-rose-500"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
                        Last Name
                      </label>
                      <Input
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
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
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="rounded-lg focus:ring-rose-500"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Subject
                    </label>
                    <Input
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="rounded-lg focus:ring-rose-500"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent resize-none p-3 transition-shadow duration-200"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-stone-500 transition-all duration-300 font-medium flex items-center justify-center group disabled:opacity-70"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-stone-100 to-stone-50  rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start space-x-4">
                    <div className="bg-white rounded-lg p-3">
                      <Mail className="h-6 w-6 text-black" />
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

                <div className="bg-gradient-to-br from-stone-100 to-stone-50  rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start space-x-4">
                    <div className="bg-white rounded-lg p-3">
                      <Clock className="h-6 w-6 text-black" />
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
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
